package com.oppuna.care

import android.app.ActivityManager
import android.content.Context
import android.os.StatFs
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.assetpacks.AssetPackManager
import com.google.android.play.core.assetpacks.AssetPackManagerFactory
import com.google.android.play.core.assetpacks.AssetPackStateUpdateListener
import com.google.android.play.core.assetpacks.model.AssetPackStatus
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Resolves the on-device GGUF for llama.cpp mmap.
 *
 * Play installs do not include the weights in the base module. The user asks
 * for an on-demand asset pack; this module copies or opens that pack only
 * after size and SHA-256 match. Sideload builds can stream the pinned
 * Hugging Face file into the same private path. Journal text is never sent.
 *
 * Storage formula (documented):
 *   requiredFreeBytes = expectedSize + STORAGE_HEADROOM_BYTES
 * One private copy is written to model.gguf.tmp then atomically moved to model.gguf.
 * An already-installed on-demand pack file is used in place so a second copy
 * is not required. We do NOT require 2× model size for the private file.
 */
class OppunaModelAssetModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()
  private val packManager: AssetPackManager by lazy {
    AssetPackManagerFactory.getInstance(reactContext)
  }
  private val packSettled = AtomicBoolean(false)
  private var packListener: AssetPackStateUpdateListener? = null
  private var packPromise: Promise? = null
  private var activePackName: String? = null
  private var confirmationRequested = false
  @Volatile private var downloadCanceled = false

  override fun getName(): String = "OppunaModelAsset"

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun getTotalMemoryBytes(promise: Promise) {
    try {
      val am = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val info = ActivityManager.MemoryInfo()
      am.getMemoryInfo(info)
      promise.resolve(info.totalMem.toDouble())
    } catch (error: Exception) {
      promise.reject("MEMORY_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun getAvailableStorageBytes(promise: Promise) {
    executor.execute {
      try {
        promise.resolve(getUsableBytes(reactContext.filesDir).toDouble())
      } catch (error: Exception) {
        promise.reject("STORAGE_ERROR", error.message, error)
      }
    }
  }

  @ReactMethod
  fun prepareLocalModel(
    assetFileName: String,
    expectedSize: Double,
    expectedSha256: String,
    forceRecopy: Boolean,
    skipFullSha: Boolean,
    packName: String,
    promise: Promise
  ) {
    executor.execute {
      try {
        val result = doPrepareLocalModel(
          assetFileName,
          expectedSize.toLong(),
          expectedSha256.lowercase(),
          forceRecopy,
          skipFullSha,
          packName
        )
        promise.resolve(result)
      } catch (error: ModelNotDownloadedException) {
        promise.reject("MODEL_NOT_DOWNLOADED", error.message, error)
      } catch (error: InsufficientStorageException) {
        promise.reject("INSUFFICIENT_STORAGE", error.message, error)
      } catch (error: Exception) {
        promise.reject("PREPARE_ERROR", error.message, error)
      }
    }
  }

  /**
   * Ask Google Play for the on-demand model pack. Does not upload anything.
   * Resolves when the pack is installed. Rejects PLAY_UNAVAILABLE when this
   * install has no Play delivery (sideload).
   */
  @ReactMethod
  fun fetchOnDemandPack(packName: String, promise: Promise) {
    downloadCanceled = false
    confirmationRequested = false
    activePackName = packName
    if (packFile(packName, MODEL_FILE_NAME) != null) {
      promise.resolve(completedPackMap(packName))
      return
    }

    packSettled.set(false)
    packPromise = promise
    val listener = AssetPackStateUpdateListener { state ->
      if (state.name() != packName || packSettled.get()) return@AssetPackStateUpdateListener
      when (state.status()) {
        AssetPackStatus.PENDING -> emitProgress("play", state.bytesDownloaded(), state.totalBytesToDownload())
        AssetPackStatus.DOWNLOADING, AssetPackStatus.TRANSFERRING -> {
          emitProgress("download", state.bytesDownloaded(), state.totalBytesToDownload())
        }
        AssetPackStatus.COMPLETED -> settlePackSuccess(completedPackMap(packName))
        AssetPackStatus.CANCELED -> settlePackFailure("DOWNLOAD_CANCELED", "Model download canceled.")
        AssetPackStatus.FAILED -> {
          settlePackFailure(
            "PLAY_UNAVAILABLE",
            "Google Play could not download the model pack."
          )
        }
        AssetPackStatus.WAITING_FOR_WIFI, AssetPackStatus.REQUIRES_USER_CONFIRMATION -> {
          requestPlayConfirmation()
        }
        else -> Unit
      }
    }
    packListener = listener
    packManager.registerListener(listener)
    packManager.fetch(listOf(packName))
      .addOnFailureListener { error ->
        val message = error.message ?: "Google Play could not download the model pack."
        settlePackFailure("PLAY_UNAVAILABLE", message)
      }
  }

  /**
   * Stream the pinned HTTPS file into private storage. The first hop must be
   * huggingface.co. Redirects stay on the Hugging Face CDN allowlist. The
   * temp file is deleted unless size, GGUF header, and SHA-256 all match.
   */
  @ReactMethod
  fun downloadPinnedModel(
    urlString: String,
    expectedSize: Double,
    expectedSha256: String,
    promise: Promise
  ) {
    executor.execute {
      downloadCanceled = false
      val tempFile = File(modelDirectory(), MODEL_TEMP_NAME)
      try {
        val result = downloadPinned(urlString, expectedSize.toLong(), expectedSha256.lowercase(), tempFile)
        promise.resolve(result)
      } catch (error: DownloadCanceledException) {
        if (tempFile.exists()) tempFile.delete()
        promise.reject("DOWNLOAD_CANCELED", error.message, error)
      } catch (error: InsufficientStorageException) {
        if (tempFile.exists()) tempFile.delete()
        promise.reject("INSUFFICIENT_STORAGE", error.message, error)
      } catch (error: SecurityException) {
        if (tempFile.exists()) tempFile.delete()
        promise.reject("NETWORK_BLOCKED", "This install cannot open a model download.", error)
      } catch (error: Exception) {
        if (tempFile.exists()) tempFile.delete()
        val blocked = error.message == "NETWORK_BLOCKED" ||
          error.message?.contains("Permission denied", ignoreCase = true) == true
        val code = if (blocked) "NETWORK_BLOCKED" else "DOWNLOAD_ERROR"
        val message = if (blocked) {
          "This install cannot open a model download."
        } else {
          error.message
        }
        promise.reject(code, message, error)
      }
    }
  }

  @ReactMethod
  fun cancelModelDownload(promise: Promise) {
    downloadCanceled = true
    val pack = activePackName
    if (pack != null) {
      try {
        packManager.cancel(listOf(pack))
      } catch (_: Exception) {
        // Sideload installs have no Play pack session.
      }
    }
    settlePackFailure("DOWNLOAD_CANCELED", "Model download canceled.")
    promise.resolve(true)
  }

  @ReactMethod
  fun removeOnDemandPack(packName: String, promise: Promise) {
    try {
      packManager.removePack(packName)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { promise.resolve(false) }
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun sha256File(path: String, promise: Promise) {
    executor.execute {
      try {
        promise.resolve(computeSha256Hex(File(path)))
      } catch (error: Exception) {
        promise.reject("SHA256_ERROR", error.message, error)
      }
    }
  }

  @ReactMethod
  fun validateGgufHeader(path: String, promise: Promise) {
    executor.execute {
      try {
        promise.resolve(isValidGgufFile(File(path)))
      } catch (error: Exception) {
        promise.reject("GGUF_HEADER_ERROR", error.message, error)
      }
    }
  }

  @ReactMethod
  fun deletePrivateModel(promise: Promise) {
    executor.execute {
      try {
        val dir = modelDirectory()
        val model = File(dir, MODEL_FILE_NAME)
        val temp = File(dir, MODEL_TEMP_NAME)
        if (temp.exists()) temp.delete()
        if (model.exists()) model.delete()
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("DELETE_ERROR", error.message, error)
      }
    }
  }

  private fun doPrepareLocalModel(
    assetFileName: String,
    expectedSize: Long,
    expectedSha256: String,
    forceRecopy: Boolean,
    skipFullSha: Boolean,
    packName: String
  ): WritableMap {
    val dir = modelDirectory()
    if (!dir.exists()) dir.mkdirs()

    val modelFile = File(dir, MODEL_FILE_NAME)
    val tempFile = File(dir, MODEL_TEMP_NAME)

    if (!forceRecopy && modelFile.exists()) {
      val existingSize = modelFile.length()
      if (existingSize == expectedSize && isValidGgufFile(modelFile)) {
        if (skipFullSha) {
          return resultMap(
            modelFile.absolutePath,
            false,
            existingSize,
            expectedSha256,
            true,
            true
          )
        }
        val existingSha = computeSha256Hex(modelFile)
        if (expectedSha256.isEmpty() || existingSha == expectedSha256) {
          return resultMap(modelFile.absolutePath, false, existingSize, existingSha, true, false)
        }
      }
      modelFile.delete()
    } else if (forceRecopy && modelFile.exists()) {
      modelFile.delete()
    }

    if (tempFile.exists()) tempFile.delete()

    val packSource = packFile(packName, assetFileName)
    if (packSource != null) {
      return verifiedExistingFile(packSource, expectedSize, expectedSha256, skipFullSha)
    }

    val requiredBytes = requiredPrivateStorageBytes(expectedSize)
    val usable = getUsableBytes(dir)
    if (usable < requiredBytes) {
      throw InsufficientStorageException(
        "Not enough storage for on-device AI model (need ~${requiredBytes / (1024 * 1024)} MB free)."
      )
    }

    try {
      copyAssetToFile(assetFileName, tempFile)
    } catch (error: FileNotFoundException) {
      if (tempFile.exists()) tempFile.delete()
      throw ModelNotDownloadedException("On-device model is not downloaded yet.")
    }

    if (tempFile.length() != expectedSize) {
      tempFile.delete()
      throw IllegalStateException("Copied model size mismatch.")
    }

    if (!isValidGgufFile(tempFile)) {
      tempFile.delete()
      throw IllegalStateException("Invalid GGUF header.")
    }

    val sha = computeSha256Hex(tempFile)
    if (expectedSha256.isNotEmpty() && sha != expectedSha256) {
      tempFile.delete()
      throw IllegalStateException("Model SHA-256 mismatch.")
    }

    atomicMoveVerifiedTemp(tempFile, modelFile)

    if (modelFile.length() != expectedSize || !isValidGgufFile(modelFile)) {
      modelFile.delete()
      throw IllegalStateException("Final model failed post-move verification.")
    }

    return resultMap(modelFile.absolutePath, true, modelFile.length(), sha, true, false)
  }

  /**
   * Use an already-installed pack file directly after size, header, and SHA checks.
   * Avoids a second ~941 MB private copy.
   */
  private fun verifiedExistingFile(
    file: File,
    expectedSize: Long,
    expectedSha256: String,
    skipFullSha: Boolean
  ): WritableMap {
    val size = file.length()
    if (size != expectedSize || !isValidGgufFile(file)) {
      throw IllegalStateException("On-demand model pack failed verification.")
    }
    if (skipFullSha) {
      return resultMap(file.absolutePath, false, size, expectedSha256, true, true)
    }
    val sha = computeSha256Hex(file)
    if (expectedSha256.isNotEmpty() && sha != expectedSha256) {
      throw IllegalStateException("Model SHA-256 mismatch.")
    }
    return resultMap(file.absolutePath, false, size, sha, true, false)
  }

  private fun downloadPinned(
    urlString: String,
    expectedSize: Long,
    expectedSha256: String,
    tempFile: File
  ): WritableMap {
    val initial = URL(urlString)
    if (!initial.protocol.equals("https", ignoreCase = true) || initial.userInfo != null) {
      throw IllegalArgumentException("Model download must use HTTPS.")
    }
    if (!initial.host.equals("huggingface.co", ignoreCase = true)) {
      throw IllegalArgumentException("Model download host is not allowed.")
    }

    val dir = modelDirectory()
    if (!dir.exists()) dir.mkdirs()
    val requiredBytes = requiredPrivateStorageBytes(expectedSize)
    if (getUsableBytes(dir) < requiredBytes) {
      throw InsufficientStorageException(
        "Not enough storage for on-device AI model (need ~${requiredBytes / (1024 * 1024)} MB free)."
      )
    }
    if (tempFile.exists()) tempFile.delete()

    val connection = openFollowingRedirects(initial)
    try {
      val code = connection.responseCode
      if (code !in 200..299) {
        throw IllegalStateException("Model download failed (HTTP $code).")
      }
      val digest = MessageDigest.getInstance("SHA-256")
      var written = 0L
      connection.inputStream.use { input ->
        FileOutputStream(tempFile).use { output ->
          val buffer = ByteArray(1024 * 1024)
          while (true) {
            if (downloadCanceled) throw DownloadCanceledException("Model download canceled.")
            val read = input.read(buffer)
            if (read <= 0) break
            if (expectedSize > 0 && written + read > expectedSize) {
              throw IllegalStateException("Downloaded model is larger than expected.")
            }
            output.write(buffer, 0, read)
            digest.update(buffer, 0, read)
            written += read
            if (written == read.toLong() || written % (8L * 1024L * 1024L) < read) {
              emitProgress("download", written, expectedSize)
            }
          }
          output.fd.sync()
        }
      }

      if (written != expectedSize) {
        throw IllegalStateException("Downloaded model size mismatch.")
      }
      if (!isValidGgufFile(tempFile)) {
        throw IllegalStateException("Invalid GGUF header.")
      }
      val sha = digest.digest().joinToString("") { "%02x".format(it) }
      if (expectedSha256.isNotEmpty() && sha != expectedSha256) {
        throw IllegalStateException("Model SHA-256 mismatch.")
      }

      val modelFile = File(dir, MODEL_FILE_NAME)
      atomicMoveVerifiedTemp(tempFile, modelFile)
      if (modelFile.length() != expectedSize || !isValidGgufFile(modelFile)) {
        modelFile.delete()
        throw IllegalStateException("Final model failed post-move verification.")
      }
      return resultMap(modelFile.absolutePath, true, modelFile.length(), sha, true, false)
    } catch (error: Exception) {
      if (tempFile.exists()) tempFile.delete()
      val modelFile = File(dir, MODEL_FILE_NAME)
      if (modelFile.exists() && modelFile.length() != expectedSize) modelFile.delete()
      throw error
    } finally {
      connection.disconnect()
    }
  }

  private fun openFollowingRedirects(start: URL): HttpURLConnection {
    var current = start
    for (hop in 0 until 5) {
      if (!isAllowedDownloadHost(current.host) || !current.protocol.equals("https", ignoreCase = true)) {
        throw IllegalArgumentException("Model download redirected to a blocked host.")
      }
      val connection = (current.openConnection() as HttpURLConnection).apply {
        instanceFollowRedirects = false
        connectTimeout = 30_000
        readTimeout = 120_000
        setRequestProperty("User-Agent", "OppunaModelDownload")
        setRequestProperty("Accept", "application/octet-stream,*/*")
      }
      val code = connection.responseCode
      if (code in 300..399) {
        val location = connection.getHeaderField("Location")
        connection.disconnect()
        if (location.isNullOrBlank()) {
          throw IllegalStateException("Model download redirect was missing a location.")
        }
        current = URL(current, location)
        continue
      }
      return connection
    }
    throw IllegalStateException("Too many redirects while downloading the model.")
  }

  private fun isAllowedDownloadHost(host: String?): Boolean {
    if (host.isNullOrBlank()) return false
    val normalized = host.lowercase().trim().trimEnd('.')
    if (normalized.contains("..") || normalized.contains("@")) return false
    if (normalized == "huggingface.co" || normalized == "cas-bridge.xethub.hf.co") return true
    return normalized.endsWith(".huggingface.co")
  }

  private fun packFile(packName: String, assetFileName: String): File? {
    if (packName.isBlank()) return null
    return try {
      val assetsPath = packManager.getPackLocation(packName)?.assetsPath() ?: return null
      val file = File(assetsPath, assetFileName)
      if (file.isFile) file else null
    } catch (_: Exception) {
      null
    }
  }

  private fun requestPlayConfirmation() {
    if (confirmationRequested) return
    confirmationRequested = true
    reactContext.runOnUiQueueThread {
      val activity = reactContext.currentActivity
      if (activity == null) {
        settlePackFailure(
          "NEED_CONFIRMATION",
          "Confirm the model download in the Play Store dialog, then try again."
        )
        return@runOnUiQueueThread
      }
      try {
        packManager.showConfirmationDialog(activity)
          ?.addOnFailureListener {
            settlePackFailure(
              "NEED_CONFIRMATION",
              "Confirm the model download to add on-device AI."
            )
          }
      } catch (_: Exception) {
        settlePackFailure(
          "NEED_CONFIRMATION",
          "Confirm the model download to add on-device AI."
        )
      }
    }
    if (downloadCanceled) {
      settlePackFailure("DOWNLOAD_CANCELED", "Model download canceled.")
    }
  }

  private fun settlePackSuccess(map: WritableMap) {
    if (!packSettled.compareAndSet(false, true)) return
    val promise = packPromise
    clearPackSession()
    promise?.resolve(map)
  }

  private fun settlePackFailure(code: String, message: String) {
    if (!packSettled.compareAndSet(false, true)) return
    val promise = packPromise
    clearPackSession()
    promise?.reject(code, message)
  }

  private fun clearPackSession() {
    val listener = packListener
    if (listener != null) {
      try {
        packManager.unregisterListener(listener)
      } catch (_: Exception) {
        // Already unregistered.
      }
    }
    packListener = null
    packPromise = null
  }

  private fun completedPackMap(packName: String): WritableMap {
    val map = Arguments.createMap()
    map.putString("status", "completed")
    map.putString("packName", packName)
    return map
  }

  private fun emitProgress(phase: String, bytes: Long, total: Long) {
    if (!reactContext.hasActiveReactInstance()) return
    val map = Arguments.createMap()
    map.putString("phase", phase)
    map.putDouble("bytesDownloaded", bytes.toDouble())
    map.putDouble("totalBytes", total.toDouble())
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("OppunaModelDownloadProgress", map)
  }

  /**
   * Atomically move temp → final within the same private directory.
   * If atomic move is unavailable, fail preparation rather than risk a
   * partially written trusted filename.
   */
  private fun atomicMoveVerifiedTemp(tempFile: File, modelFile: File) {
    if (modelFile.exists() && !modelFile.delete()) {
      tempFile.delete()
      throw IllegalStateException("Could not remove existing model before atomic move.")
    }

    try {
      Files.move(
        tempFile.toPath(),
        modelFile.toPath(),
        StandardCopyOption.ATOMIC_MOVE,
        StandardCopyOption.REPLACE_EXISTING
      )
    } catch (atomicError: Exception) {
      if (tempFile.exists()) tempFile.delete()
      if (modelFile.exists()) modelFile.delete()
      throw IllegalStateException(
        "Atomic model finalize failed: ${atomicError.message}",
        atomicError
      )
    }

    if (tempFile.exists()) {
      tempFile.delete()
    }
  }

  private fun copyAssetToFile(assetFileName: String, dest: File) {
    reactContext.assets.open(assetFileName).use { input ->
      FileOutputStream(dest).use { output ->
        val buffer = ByteArray(1024 * 1024)
        while (true) {
          val read = input.read(buffer)
          if (read <= 0) break
          output.write(buffer, 0, read)
        }
        output.fd.sync()
      }
    }
  }

  private fun modelDirectory(): File = File(reactContext.filesDir, "ai-model")

  private fun getUsableBytes(path: File): Long {
    val stat = StatFs(path.absolutePath)
    return stat.availableBlocksLong * stat.blockSizeLong
  }

  private fun isValidGgufFile(file: File): Boolean {
    if (!file.exists() || file.length() < 4) return false
    FileInputStream(file).use { input ->
      val header = ByteArray(4)
      val read = input.read(header)
      if (read < 4) return false
      return header[0] == 0x47.toByte() &&
        header[1] == 0x47.toByte() &&
        header[2] == 0x55.toByte() &&
        header[3] == 0x46.toByte()
    }
  }

  private fun computeSha256Hex(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    FileInputStream(file).use { input ->
      val buffer = ByteArray(1024 * 1024)
      while (true) {
        val read = input.read(buffer)
        if (read <= 0) break
        digest.update(buffer, 0, read)
      }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
  }

  private fun resultMap(
    path: String,
    copied: Boolean,
    size: Long,
    sha256: String,
    verified: Boolean,
    shaSkipped: Boolean = false
  ): WritableMap {
    val map = Arguments.createMap()
    map.putString("path", path)
    map.putBoolean("copied", copied)
    map.putDouble("size", size.toDouble())
    map.putString("sha256", sha256)
    map.putBoolean("verified", verified)
    map.putBoolean("shaSkipped", shaSkipped)
    return map
  }

  private class InsufficientStorageException(message: String) : Exception(message)
  private class ModelNotDownloadedException(message: String) : Exception(message)
  private class DownloadCanceledException(message: String) : Exception(message)

  companion object {
    private const val MODEL_FILE_NAME = "model.gguf"
    private const val MODEL_TEMP_NAME = "model.gguf.tmp"
    /** ~150 MiB headroom for FS overhead and normal app operation. */
    private const val STORAGE_HEADROOM_BYTES = 150L * 1024L * 1024L

    fun requiredPrivateStorageBytes(expectedSize: Long): Long {
      return expectedSize + STORAGE_HEADROOM_BYTES
    }
  }
}
