package com.oppuna.care

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlin.math.min

/**
 * Streams 24 kHz PCM16 to JavaScript and plays PCM16 replies on one track.
 * Playback uses media attributes so speech is not run through the voice-call
 * processor. Capture keeps acoustic echo cancellation on the same session.
 * Used only by Talk to Oppuna.
 */
class OppunaPcmAudioModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private var recorder: AudioRecord? = null
  private var captureThread: Thread? = null
  @Volatile private var capturing = false
  private var echoCanceler: AcousticEchoCanceler? = null
  private var noiseSuppressor: NoiseSuppressor? = null
  private var gainControl: AutomaticGainControl? = null
  private var track: AudioTrack? = null
  private var trackRate = 0
  private var captureSessionId = 0
  private val playbackLock = Any()
  private val playQueue = ArrayDeque<ByteArray>()
  @Volatile private var playGeneration = 0
  private var writer: Thread? = null
  private var writerGeneration = -1
  private var sourceRate = OUTPUT_RATE
  private var playbackOdd = ByteArray(0)
  private var playbackPending = ByteArray(0)
  private var playbackPhase = 0.0
  private var outputFormatSent = false
  private var pending = ByteArray(0)
  private var resamplePhase = 0.0

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
      captureSessionId = record.audioSessionId
      if (AcousticEchoCanceler.isAvailable()) {
        echoCanceler = AcousticEchoCanceler.create(record.audioSessionId)?.apply { enabled = true }
      }
      if (NoiseSuppressor.isAvailable()) {
        noiseSuppressor = NoiseSuppressor.create(record.audioSessionId)?.apply { enabled = true }
      }
      if (AutomaticGainControl.isAvailable()) {
        gainControl = AutomaticGainControl.create(record.audioSessionId)?.apply { enabled = true }
      }
      synchronized(playbackLock) {
        playGeneration += 1
        playQueue.clear()
        playbackOdd = ByteArray(0)
        playbackPending = ByteArray(0)
        playbackPhase = 0.0
        outputFormatSent = false
        releaseTrackLocked()
        (playbackLock as java.lang.Object).notifyAll()
      }
      resetConverter()
      recorder = record
      capturing = true
      val format = Arguments.createMap()
      format.putInt("sampleRate", inputRate)
      format.putInt("channels", 1)
      format.putInt("targetRate", targetRate)
      emit("OppunaPcmFormat", format)
      record.startRecording()
      captureThread = Thread {
        val chunkBytes = maxOf(minBuffer, (inputRate * 2 * 40) / 1000)
        val buffer = ByteArray(chunkBytes)
        while (capturing) {
          val read = record.read(buffer, 0, buffer.size)
          if (read <= 0) continue
          val slice = if (read == buffer.size) buffer else buffer.copyOf(read)
          val pcm = convertCapture(slice, inputRate, targetRate)
          if (pcm.isEmpty()) continue
          val payload = Arguments.createMap()
          payload.putString("audio", Base64.encodeToString(pcm, Base64.NO_WRAP))
          emit("OppunaPcmChunk", payload)
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
    noiseSuppressor?.release()
    noiseSuppressor = null
    gainControl?.release()
    gainControl = null
    recorder?.run {
      try {
        stop()
      } catch (_: IllegalStateException) {
        // Already stopped.
      }
      release()
    }
    recorder = null
    captureSessionId = 0
    resetConverter()
    stopPlayback()
    promise.resolve(null)
  }

  @ReactMethod
  fun playPcm16(base64: String, sampleRate: Int) {
    if (base64.isEmpty()) return
    val decoded = Base64.decode(base64, Base64.NO_WRAP)
    if (decoded.isEmpty()) return
    synchronized(playbackLock) {
      sourceRate = if (sampleRate > 0) sampleRate else OUTPUT_RATE
      val aligned = alignPlayback(decoded)
      if (aligned.isEmpty()) return
      playQueue.addLast(aligned)
      ensureWriterLocked()
      (playbackLock as java.lang.Object).notifyAll()
    }
  }

  @ReactMethod
  fun stopPlayback() {
    synchronized(playbackLock) {
      playGeneration += 1
      playQueue.clear()
      playbackOdd = ByteArray(0)
      playbackPending = ByteArray(0)
      playbackPhase = 0.0
      flushTrackLocked()
      (playbackLock as java.lang.Object).notifyAll()
    }
  }

  private fun emit(name: String, payload: com.facebook.react.bridge.WritableMap) {
    if (!reactContext.hasActiveReactInstance()) return
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(name, payload)
  }

  private fun ensureTrack(incomingRate: Int): AudioTrack {
    val outputRate = chooseOutputRate(if (incomingRate > 0) incomingRate else OUTPUT_RATE)
    val existing = track
    if (existing != null && trackRate == outputRate && existing.state == AudioTrack.STATE_INITIALIZED) {
      return existing
    }
    releaseTrackLocked()
    val minBuffer = AudioTrack.getMinBufferSize(
      outputRate,
      AudioFormat.CHANNEL_OUT_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
    )
    val builder = AudioTrack.Builder()
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build(),
      )
      .setAudioFormat(
        AudioFormat.Builder()
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .setSampleRate(outputRate)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .build(),
      )
      .setTransferMode(AudioTrack.MODE_STREAM)
      .setBufferSizeInBytes(maxOf(minBuffer, outputRate * 2))
    if (captureSessionId > 0) builder.setSessionId(captureSessionId)
    val player = builder.build()
    player.play()
    track = player
    trackRate = outputRate
    if (!outputFormatSent) {
      outputFormatSent = true
      val format = Arguments.createMap()
      format.putInt("sourceRate", incomingRate)
      format.putInt("trackRate", outputRate)
      format.putInt("channels", 1)
      emit("OppunaPcmOutput", format)
    }
    return player
  }

  private fun ensureWriterLocked() {
    val running = writer
    if (running != null && running.isAlive && writerGeneration == playGeneration) return
    val generation = playGeneration
    writerGeneration = generation
    writer = Thread {
      try {
        writerLoop(generation)
      } finally {
        synchronized(playbackLock) {
          if (writer === Thread.currentThread()) writer = null
        }
      }
    }.also {
      it.name = "oppuna-pcm-play"
      it.start()
    }
  }

  private fun writerLoop(generation: Int) {
    while (true) {
      val next = synchronized(playbackLock) {
        while (playQueue.isEmpty() && generation == playGeneration) {
          try {
            (playbackLock as java.lang.Object).wait(500)
          } catch (_: InterruptedException) {
            return
          }
        }
        if (generation != playGeneration || playQueue.isEmpty()) return
        playQueue.removeFirst()
      }
      val player = synchronized(playbackLock) {
        if (generation != playGeneration) return
        ensureTrack(sourceRate)
      }
      val pcm = resamplePlayback(next)
      if (pcm.isEmpty()) continue
      var offset = 0
      while (offset < pcm.size) {
        if (generation != playGeneration) {
          synchronized(playbackLock) { flushTrackLocked() }
          return
        }
        val written = player.write(pcm, offset, pcm.size - offset)
        if (written <= 0) break
        offset += written
      }
      if (generation != playGeneration) {
        synchronized(playbackLock) { flushTrackLocked() }
        return
      }
    }
  }

  private fun flushTrackLocked() {
    track?.let { player ->
      try {
        player.pause()
        player.flush()
        if (player.playState != AudioTrack.PLAYSTATE_PLAYING) player.play()
      } catch (_: IllegalStateException) {
        // Already released.
      }
    }
  }

  private fun alignPlayback(incoming: ByteArray): ByteArray {
    val merged = if (playbackOdd.isEmpty()) incoming else playbackOdd + incoming
    if (merged.isEmpty()) return merged
    if (merged.size % 2 == 1) {
      playbackOdd = byteArrayOf(merged[merged.lastIndex])
      return merged.copyOf(merged.size - 1)
    }
    playbackOdd = ByteArray(0)
    return merged
  }

  private fun chooseOutputRate(preferred: Int): Int {
    if (supportsOutputRate(preferred)) return preferred
    if (preferred != 48000 && supportsOutputRate(48000)) return 48000
    if (supportsOutputRate(44100)) return 44100
    return preferred
  }

  private fun supportsOutputRate(rate: Int): Boolean {
    return AudioTrack.getMinBufferSize(
      rate,
      AudioFormat.CHANNEL_OUT_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
    ) > 0
  }

  private fun resamplePlayback(slice: ByteArray): ByteArray {
    val inputRate = sourceRate
    val targetRate = trackRate
    if (inputRate == targetRate || inputRate <= 0 || targetRate <= 0) return slice
    val merged = if (playbackPending.isEmpty()) slice else playbackPending + slice
    val even = merged.size - (merged.size % 2)
    if (even < 4) {
      playbackPending = merged
      return ByteArray(0)
    }
    val samples = ShortArray(even / 2)
    var index = 0
    while (index < samples.size) {
      val lo = merged[index * 2].toInt() and 0xff
      val hi = merged[index * 2 + 1].toInt() and 0xff
      samples[index] = ((hi shl 8) or lo).toShort()
      index += 1
    }
    val oddTail = if (even == merged.size) ByteArray(0) else byteArrayOf(merged[merged.lastIndex])
    if (inputRate > targetRate) {
      val ratio = inputRate.toDouble() / targetRate.toDouble()
      val outCount = (samples.size / ratio).toInt()
      if (outCount <= 0) {
        playbackPending = merged
        return ByteArray(0)
      }
      val output = ByteArray(outCount * 2)
      var consumed = 0
      var outIndex = 0
      while (outIndex < outCount) {
        val start = (outIndex * ratio).toInt()
        val end = min(samples.size, ((outIndex + 1) * ratio).toInt())
        var sum = 0
        var count = 0
        var cursor = start
        while (cursor < end) {
          sum += samples[cursor].toInt()
          count += 1
          cursor += 1
        }
        val averaged = if (count == 0) 0 else sum / count
        output[outIndex * 2] = (averaged and 0xff).toByte()
        output[outIndex * 2 + 1] = ((averaged shr 8) and 0xff).toByte()
        consumed = end
        outIndex += 1
      }
      playbackPending = leftover(samples, consumed) + oddTail
      return output
    }
    val step = inputRate.toDouble() / targetRate.toDouble()
    val outputSamples = ArrayList<Int>()
    var pos = playbackPhase
    while (pos + 1 < samples.size) {
      val cursor = pos.toInt()
      val frac = pos - cursor
      val a = samples[cursor].toInt()
      val b = samples[cursor + 1].toInt()
      outputSamples.add((a + ((b - a) * frac)).toInt().coerceIn(-32768, 32767))
      pos += step
    }
    val consumed = min(samples.size, pos.toInt())
    playbackPhase = pos - consumed
    playbackPending = leftover(samples, consumed) + oddTail
    val output = ByteArray(outputSamples.size * 2)
    outputSamples.forEachIndexed { sampleIndex, value ->
      output[sampleIndex * 2] = (value and 0xff).toByte()
      output[sampleIndex * 2 + 1] = ((value shr 8) and 0xff).toByte()
    }
    return output
  }

  private fun releaseTrackLocked() {
    track?.let { player ->
      try {
        player.pause()
        player.flush()
        player.release()
      } catch (_: IllegalStateException) {
        // Already released.
      }
    }
    track = null
    trackRate = 0
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

  private fun resetConverter() {
    pending = ByteArray(0)
    resamplePhase = 0.0
  }

  private fun convertCapture(slice: ByteArray, inputRate: Int, targetRate: Int): ByteArray {
    if (inputRate == targetRate) return slice
    val merged = if (pending.isEmpty()) slice else pending + slice
    val even = merged.size - (merged.size % 2)
    if (even < 2) {
      pending = merged
      return ByteArray(0)
    }
    val samples = ShortArray(even / 2)
    var index = 0
    while (index < samples.size) {
      val lo = merged[index * 2].toInt() and 0xff
      val hi = merged[index * 2 + 1].toInt() and 0xff
      samples[index] = ((hi shl 8) or lo).toShort()
      index += 1
    }
    val oddTail = if (even == merged.size) ByteArray(0) else byteArrayOf(merged[merged.lastIndex])
    if (inputRate > targetRate) {
      val ratio = inputRate.toDouble() / targetRate.toDouble()
      val outCount = (samples.size / ratio).toInt()
      if (outCount <= 0) {
        pending = merged
        return ByteArray(0)
      }
      val output = ByteArray(outCount * 2)
      var consumed = 0
      var outIndex = 0
      while (outIndex < outCount) {
        val start = (outIndex * ratio).toInt()
        val end = min(samples.size, ((outIndex + 1) * ratio).toInt())
        var sum = 0
        var count = 0
        var cursor = start
        while (cursor < end) {
          sum += samples[cursor].toInt()
          count += 1
          cursor += 1
        }
        val averaged = if (count == 0) 0 else sum / count
        output[outIndex * 2] = (averaged and 0xff).toByte()
        output[outIndex * 2 + 1] = ((averaged shr 8) and 0xff).toByte()
        consumed = end
        outIndex += 1
      }
      pending = leftover(samples, consumed) + oddTail
      return output
    }
    val step = inputRate.toDouble() / targetRate.toDouble()
    val outputSamples = ArrayList<Int>()
    var pos = resamplePhase
    while (pos + 1 < samples.size) {
      val cursor = pos.toInt()
      val frac = pos - cursor
      val a = samples[cursor].toInt()
      val b = samples[cursor + 1].toInt()
      val value = (a + ((b - a) * frac)).toInt().coerceIn(-32768, 32767)
      outputSamples.add(value)
      pos += step
    }
    val consumed = min(samples.size, pos.toInt())
    resamplePhase = pos - consumed
    pending = leftover(samples, consumed) + oddTail
    val output = ByteArray(outputSamples.size * 2)
    outputSamples.forEachIndexed { sampleIndex, value ->
      output[sampleIndex * 2] = (value and 0xff).toByte()
      output[sampleIndex * 2 + 1] = ((value shr 8) and 0xff).toByte()
    }
    return output
  }

  private fun leftover(samples: ShortArray, from: Int): ByteArray {
    if (from >= samples.size) return ByteArray(0)
    val output = ByteArray((samples.size - from) * 2)
    var offset = 0
    var cursor = from
    while (cursor < samples.size) {
      val value = samples[cursor].toInt()
      output[offset] = (value and 0xff).toByte()
      output[offset + 1] = ((value shr 8) and 0xff).toByte()
      offset += 2
      cursor += 1
    }
    return output
  }

  companion object {
    private const val OUTPUT_RATE = 24000
  }
}
