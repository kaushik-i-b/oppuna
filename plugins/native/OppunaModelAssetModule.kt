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
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.concurrent.Executors

/**
 * Resolves install-time Play Asset Delivery models via AssetManager and copies
 * them into app-private storage for llama.cpp mmap access.
 *
 * Storage formula (documented):
 *   requiredFreeBytes = expectedSize + STORAGE_HEADROOM_BYTES
 * One private copy is written to model.gguf.tmp then atomically moved to model.gguf.
 * We do NOT require 2× model size because the non-atomic copy fallback was removed.
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
    skipFullSha: Boolean,
    promise: Promise
  ) {
    executor.execute {
      try {
        val result = doPrepareLocalModel(
          assetFileName,
          expectedSize.toLong(),
          expectedSha256.lowercase(),
          forceRecopy,
          skipFullSha
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
    forceRecopy: Boolean,
    skipFullSha: Boolean
  ): WritableMap {
    val dir = modelDirectory()
    if (!dir.exists()) dir.mkdirs()

    val modelFile = File(dir, MODEL_FILE_NAME)
    val tempFile = File(dir, MODEL_TEMP_NAME)

    if (!forceRecopy && modelFile.exists()) {
      val existingSize = modelFile.length()
      if (existingSize == expectedSize && isValidGgufFile(modelFile)) {
        // Trusted JS verification metadata may authorize skipping a full private-copy rehash.
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
    }

    if (tempFile.exists()) tempFile.delete()

    // One private copy + safety headroom (not 2× model size).
    val requiredBytes = requiredPrivateStorageBytes(expectedSize)
    val usable = getUsableBytes(dir)
    if (usable < requiredBytes) {
      if (tempFile.exists()) tempFile.delete()
      throw InsufficientStorageException(
        "Not enough storage for on-device AI model (need ~${requiredBytes / (1024 * 1024)} MB free)."
      )
    }

    // First install / repair always performs a full SHA of the temp copy.
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

    // Atomic finalize only — never non-atomic copy into the trusted final name.
    atomicMoveVerifiedTemp(tempFile, modelFile)

    if (modelFile.length() != expectedSize || !isValidGgufFile(modelFile)) {
      modelFile.delete()
      throw IllegalStateException("Final model failed post-move verification.")
    }

    return resultMap(modelFile.absolutePath, true, modelFile.length(), sha, true, false)
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
      // Do NOT fall back to non-atomic copy into the final trusted path.
      if (tempFile.exists()) tempFile.delete()
      if (modelFile.exists()) modelFile.delete()
      throw IllegalStateException(
        "Atomic model finalize failed: ${atomicError.message}",
        atomicError
      )
    }

    if (tempFile.exists()) {
      // Should not remain after a successful atomic move.
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
