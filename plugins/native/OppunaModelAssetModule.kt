package com.oppuna.app

import android.app.ActivityManager
import android.content.Context
import android.os.StatFs
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.Executors

/**
 * Resolves install-time Play Asset Delivery models via AssetManager and copies
 * them into app-private storage for llama.cpp mmap access.
 */
class OppunaModelAssetModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = "OppunaModelAsset"

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
    promise: Promise
  ) {
    executor.execute {
      try {
        val result = doPrepareLocalModel(
          assetFileName,
          expectedSize.toLong(),
          expectedSha256.lowercase(),
          forceRecopy
        )
        promise.resolve(result)
      } catch (error: InsufficientStorageException) {
        promise.reject("INSUFFICIENT_STORAGE", error.message, error)
      } catch (error: Exception) {
        promise.reject("PREPARE_ERROR", error.message, error)
      }
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
    forceRecopy: Boolean
  ): WritableMap {
    val dir = modelDirectory()
    if (!dir.exists()) dir.mkdirs()

    val modelFile = File(dir, MODEL_FILE_NAME)
    val tempFile = File(dir, MODEL_TEMP_NAME)

    if (!forceRecopy && modelFile.exists()) {
      val existingSize = modelFile.length()
      if (existingSize == expectedSize && isValidGgufFile(modelFile)) {
        val existingSha = computeSha256Hex(modelFile)
        if (expectedSha256.isEmpty() || existingSha == expectedSha256) {
          return resultMap(modelFile.absolutePath, false, existingSize, existingSha, true)
        }
      }
      modelFile.delete()
    }

    if (tempFile.exists()) tempFile.delete()

    val requiredBytes = expectedSize * 2 + STORAGE_HEADROOM_BYTES
    val usable = getUsableBytes(dir)
    if (usable < requiredBytes) {
      if (tempFile.exists()) tempFile.delete()
      throw InsufficientStorageException(
        "Not enough storage for on-device AI model (need ~${requiredBytes / (1024 * 1024)} MB free)."
      )
    }

    copyAssetToFile(assetFileName, tempFile)

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

    if (modelFile.exists()) modelFile.delete()
    if (!tempFile.renameTo(modelFile)) {
      tempFile.copyTo(modelFile, overwrite = true)
      tempFile.delete()
    }

    syncFile(modelFile)

    return resultMap(modelFile.absolutePath, true, modelFile.length(), sha, true)
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

  private fun syncFile(file: File) {
    FileOutputStream(file, true).use { it.fd.sync() }
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
    verified: Boolean
  ): WritableMap {
    val map = Arguments.createMap()
    map.putString("path", path)
    map.putBoolean("copied", copied)
    map.putDouble("size", size.toDouble())
    map.putString("sha256", sha256)
    map.putBoolean("verified", verified)
    return map
  }

  private class InsufficientStorageException(message: String) : Exception(message)

  companion object {
    private const val MODEL_FILE_NAME = "model.gguf"
    private const val MODEL_TEMP_NAME = "model.gguf.tmp"
    private const val STORAGE_HEADROOM_BYTES = 100L * 1024L * 1024L
  }
}
