package com.rnsubjectcutout

import android.graphics.Bitmap
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors

class SubjectCutoutModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName() = "RNSubjectCutout"

  @ReactMethod
  fun extractSubjects(uriString: String, promise: Promise) {
    executor.execute {
      try {
        val image = InputImage.fromFilePath(reactContext, Uri.parse(uriString))
        val subjectBitmapOptions = SubjectSegmenterOptions.SubjectResultOptions.Builder()
          .enableSubjectBitmap()
          .build()
        val options = SubjectSegmenterOptions.Builder()
          .enableMultipleSubjects(subjectBitmapOptions)
          .build()
        val segmenter = SubjectSegmentation.getClient(options)

        try {
          val result = Tasks.await(segmenter.process(image))
          val subjects = Arguments.createArray()

          result.subjects.forEachIndexed { index, subject ->
            val bitmap = subject.bitmap ?: return@forEachIndexed
            subjects.pushMap(writeSubject(bitmap, index))
          }

          if (subjects.size() == 0) {
            promise.reject("E_NO_SUBJECT", "No foreground subject was detected in this image.")
            return@execute
          }

          promise.resolve(Arguments.createMap().apply { putArray("subjects", subjects) })
        } finally {
          segmenter.close()
        }
      } catch (exception: Exception) {
        promise.reject("E_PROCESSING_FAILED", "Unable to extract image subjects.", exception)
      }
    }
  }

  @ReactMethod
  fun clearCache(promise: Promise) {
    executor.execute {
      try {
        outputDirectory().deleteRecursively()
        promise.resolve(null)
      } catch (exception: Exception) {
        promise.reject("E_CACHE_CLEAR_FAILED", "Unable to clear subject cutout cache.", exception)
      }
    }
  }

  private fun writeSubject(bitmap: Bitmap, index: Int) = Arguments.createMap().apply {
    val directory = outputDirectory()
    if (!directory.exists() && !directory.mkdirs()) {
      throw IOException("Could not create output directory.")
    }

    val output = File(directory, "subject-${UUID.randomUUID()}.png")
    FileOutputStream(output).use { stream ->
      if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)) {
        throw IOException("Could not encode output PNG.")
      }
    }

    putInt("index", index)
    putString("uri", Uri.fromFile(output).toString())
    putInt("width", bitmap.width)
    putInt("height", bitmap.height)
  }

  private fun outputDirectory(): File = File(reactContext.cacheDir, "rn-subject-cutout")
}
