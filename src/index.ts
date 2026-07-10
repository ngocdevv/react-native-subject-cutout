import { NativeModules } from 'react-native';

export type Subject = {
  /** Zero-based index assigned by the native segmentation framework. */
  index: number;
  /** Local file URI of a transparent PNG, for example `file:///.../subject.png`. */
  uri: string;
  /** Pixel dimensions of the cropped PNG. */
  width: number;
  height: number;
};

export type SubjectExtractionResult = {
  /** All foreground subjects detected in the source image. */
  subjects: Subject[];
};

type NativeSubjectCutout = {
  extractSubjects(uri: string): Promise<SubjectExtractionResult>;
  clearCache(): Promise<void>;
};

const LINKING_ERROR =
  'The native module RNSubjectCutout is unavailable. Rebuild the iOS/Android app after installing react-native-subject-cutout.';

const nativeModule = NativeModules.RNSubjectCutout as NativeSubjectCutout | undefined;

function getNativeModule(): NativeSubjectCutout {
  if (!nativeModule) {
    throw new Error(LINKING_ERROR);
  }
  return nativeModule;
}

/**
 * Extracts every foreground subject from a local image URI and writes each one
 * as a cropped transparent PNG in the app cache directory.
 */
export async function extractSubjects(uri: string): Promise<SubjectExtractionResult> {
  if (!uri) {
    throw new Error('A non-empty local image URI is required.');
  }

  return getNativeModule().extractSubjects(uri);
}

/**
 * Convenience helper for the common single-sticker flow in the reference video.
 * Throws when no foreground subject was detected.
 */
export async function cutout(uri: string, subjectIndex = 0): Promise<Subject> {
  const { subjects } = await extractSubjects(uri);
  const subject = subjects[subjectIndex];

  if (!subject) {
    throw new Error(`No foreground subject exists at index ${subjectIndex}.`);
  }

  return subject;
}

/** Removes temporary PNGs produced by this module. */
export function clearCache(): Promise<void> {
  return getNativeModule().clearCache();
}
