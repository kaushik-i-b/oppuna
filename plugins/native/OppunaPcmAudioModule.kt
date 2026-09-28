package com.oppuna.care

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.min

/**
 * Streams 24 kHz PCM16 to JavaScript and plays PCM16 replies.
 * Used only by Talk to Oppuna. Voice notes still use expo-audio.
 */
class OppunaPcmAudioModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private var recorder: AudioRecord? = null
  private var captureThread: Thread? = null
  @Volatile private var capturing = false
  private var echoCanceler: AcousticEchoCanceler? = null
  private var track: AudioTrack? = null
  private val playbackLock = Any()

  override fun getName(): String = "OppunaPcmAudio"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun startCapture(sampleRate: Int, promise: Promise) {
    if (capturing) {
      promise.resolve(null)
      return
    }
    try {
      val targetRate = if (sampleRate > 0) sampleRate else OUTPUT_RATE
      val inputRate = chooseInputRate(targetRate)
      val channel = AudioFormat.CHANNEL_IN_MONO
      val encoding = AudioFormat.ENCODING_PCM_16BIT
      val minBuffer = AudioRecord.getMinBufferSize(inputRate, channel, encoding)
      if (minBuffer <= 0) {
        promise.reject("pcm_unavailable", "This device cannot open a PCM microphone.")
        return
      }
      val bufferSize = minBuffer * 2
      val record = AudioRecord(
        MediaRecorder.AudioSource.VOICE_COMMUNICATION,
        inputRate,
        channel,
        encoding,
        bufferSize,
      )
      if (record.state != AudioRecord.STATE_INITIALIZED) {
        record.release()
        promise.reject("pcm_unavailable", "Microphone initialization failed.")
        return
      }
      if (AcousticEchoCanceler.isAvailable()) {
        echoCanceler = AcousticEchoCanceler.create(record.audioSessionId)?.apply { enabled = true }
      }
      recorder = record
      capturing = true
      record.startRecording()
      captureThread = Thread {
        val chunkBytes = maxOf(minBuffer, (inputRate * 2 * 40) / 1000)
        val buffer = ByteArray(chunkBytes)
        while (capturing) {
          val read = record.read(buffer, 0, buffer.size)
          if (read <= 0) continue
          val slice = if (read == buffer.size) buffer else buffer.copyOf(read)
          val pcm = if (inputRate == targetRate) slice else downsamplePcm16(slice, inputRate, targetRate)
          if (pcm.isEmpty()) continue
          val payload = Arguments.createMap()
          payload.putString("audio", Base64.encodeToString(pcm, Base64.NO_WRAP))
          if (reactContext.hasActiveReactInstance()) {
            reactContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
              .emit("OppunaPcmChunk", payload)
          }
        }
      }.also { it.start() }
      promise.resolve(null)
    } catch (error: Exception) {
      capturing = false
      promise.reject("pcm_unavailable", error.message, error)
    }
  }

  @ReactMethod
  fun stopCapture(promise: Promise) {
    capturing = false
    try {
      captureThread?.join(400)
    } catch (_: InterruptedException) {
      // Stopping anyway.
    }
    captureThread = null
    echoCanceler?.release()
    echoCanceler = null
    recorder?.run {
      try {
        stop()
      } catch (_: IllegalStateException) {
        // Already stopped.
      }
      release()
    }
    recorder = null
    promise.resolve(null)
  }

  @ReactMethod
  fun playPcm16(base64: String, sampleRate: Int) {
    if (base64.isEmpty()) return
    val bytes = Base64.decode(base64, Base64.NO_WRAP)
    if (bytes.isEmpty()) return
    synchronized(playbackLock) {
      val player = ensureTrack(if (sampleRate > 0) sampleRate else OUTPUT_RATE)
      if (player.playState != AudioTrack.PLAYSTATE_PLAYING) {
        player.play()
      }
      player.write(bytes, 0, bytes.size)
    }
  }

  @ReactMethod
  fun stopPlayback() {
    synchronized(playbackLock) {
      track?.let { player ->
        try {
          player.pause()
          player.flush()
        } catch (_: IllegalStateException) {
          // Already released.
        }
      }
    }
  }

  private fun ensureTrack(sampleRate: Int): AudioTrack {
    val existing = track
    if (existing != null) return existing
    val minBuffer = AudioTrack.getMinBufferSize(
      sampleRate,
      AudioFormat.CHANNEL_OUT_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
    )
    val player = AudioTrack.Builder()
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build(),
      )
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(sampleRate)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .build(),
      )
      .setTransferMode(AudioTrack.MODE_STREAM)
      .setBufferSizeInBytes(maxOf(minBuffer, sampleRate))
      .build()
    player.play()
    track = player
    return player
  }

  private fun chooseInputRate(preferred: Int): Int {
    val candidates = intArrayOf(preferred, 48000, 16000, 44100)
    for (rate in candidates) {
      val min = AudioRecord.getMinBufferSize(
        rate,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT,
      )
      if (min > 0) return rate
    }
    return preferred
  }

  private fun downsamplePcm16(input: ByteArray, inputRate: Int, outputRate: Int): ByteArray {
    if (outputRate <= 0 || inputRate <= outputRate) return input
    val inputSamples = input.size / 2
    val ratio = inputRate.toDouble() / outputRate.toDouble()
    val outputSamples = (inputSamples / ratio).toInt()
    if (outputSamples <= 0) return ByteArray(0)
    val output = ByteArray(outputSamples * 2)
    for (index in 0 until outputSamples) {
      val start = (index * ratio).toInt()
      val end = min(inputSamples, ((index + 1) * ratio).toInt())
      var sum = 0
      var count = 0
      var cursor = start
      while (cursor < end) {
        val lo = input[cursor * 2].toInt() and 0xff
        val hi = input[cursor * 2 + 1].toInt() and 0xff
        sum += ((hi shl 8) or lo).toShort().toInt()
        count += 1
        cursor += 1
      }
      val averaged = if (count == 0) 0 else sum / count
      output[index * 2] = (averaged and 0xff).toByte()
      output[index * 2 + 1] = ((averaged shr 8) and 0xff).toByte()
    }
    return output
  }

  companion object {
    private const val OUTPUT_RATE = 24000
  }
}
