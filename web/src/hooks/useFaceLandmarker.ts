'use client';

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export type PoseAngle = 'front' | 'left' | 'right' | 'up' | 'down';

export type FaceAnalysis = {
  faceCount: number;
  yaw: number; // degrees: negative = head turned to the person's left
  pitch: number; // degrees: positive = head tilted up
};

// Detection thresholds (degrees). Tuned to be forgiving but directional.
const YAW_THRESHOLD = 13;
const PITCH_THRESHOLD = 11;
const FRONT_TOLERANCE = 12;

// Flip these if a correct head turn is rejected on a given device/orientation.
const YAW_SIGN = 1;
const PITCH_SIGN = 1;

/** Derive yaw/pitch (degrees) from a MediaPipe column-major 4x4 transform matrix. */
export function eulerFromMatrix(data: number[] | Float32Array): { yaw: number; pitch: number } {
  const m = (r: number, c: number) => data[c * 4 + r];
  const yaw = (Math.atan2(-m(2, 0), Math.hypot(m(2, 1), m(2, 2))) * 180) / Math.PI;
  const pitch = (Math.atan2(m(2, 1), m(2, 2)) * 180) / Math.PI;
  return { yaw: yaw * YAW_SIGN, pitch: pitch * PITCH_SIGN };
}

export type ValidationTarget = PoseAngle | 'presence';

/** Validates only that exactly one human face is present. */
export function presenceError(a: FaceAnalysis): string | null {
  if (a.faceCount === 0) return 'No human face detected. Position your face in the frame.';
  if (a.faceCount > 1) return 'Multiple faces detected. Only one person should be in frame.';
  return null;
}

/** Returns a human-readable error if the frame fails validation for the angle, else null. */
export function poseError(angle: PoseAngle, a: FaceAnalysis): string | null {
  const presence = presenceError(a);
  if (presence) return presence;

  const { yaw, pitch } = a;
  switch (angle) {
    case 'front':
      if (Math.abs(yaw) > FRONT_TOLERANCE || Math.abs(pitch) > FRONT_TOLERANCE)
        return 'Look straight at the camera.';
      return null;
    case 'left':
      if (yaw > -YAW_THRESHOLD) return 'Turn your head to your LEFT.';
      return null;
    case 'right':
      if (yaw < YAW_THRESHOLD) return 'Turn your head to your RIGHT.';
      return null;
    case 'up':
      if (pitch < PITCH_THRESHOLD) return 'Tilt your head UP.';
      return null;
    case 'down':
      if (pitch > -PITCH_THRESHOLD) return 'Tilt your head DOWN.';
      return null;
    default:
      return null;
  }
}

export function useFaceLandmarker() {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 2,
          outputFacialTransformationMatrixes: true,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Face detector failed to load');
      }
    })();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  /** Analyze the current video frame. Returns null if the detector is not ready. */
  const analyze = useCallback((video: HTMLVideoElement): FaceAnalysis | null => {
    const landmarker = landmarkerRef.current;
    if (!landmarker || video.readyState < 2) return null;
    const result = landmarker.detectForVideo(video, performance.now());
    const faceCount = result.faceLandmarks?.length ?? 0;
    const matrix = result.facialTransformationMatrixes?.[0]?.data;
    if (faceCount === 0 || !matrix) return { faceCount, yaw: 0, pitch: 0 };
    const { yaw, pitch } = eulerFromMatrix(matrix);
    return { faceCount, yaw, pitch };
  }, []);

  return { ready, error, analyze };
}

function checkTarget(target: ValidationTarget, a: FaceAnalysis): string | null {
  return target === 'presence' ? presenceError(a) : poseError(target, a);
}

/**
 * Runs continuous face validation against a live <video> element.
 * Fails open: if the detector cannot load (e.g. CDN blocked), validation is
 * skipped so attendance still works.
 */
export function useLiveFaceValidation(
  videoRef: RefObject<HTMLVideoElement | null>,
  target: ValidationTarget,
  enabled: boolean,
) {
  const { ready, error, analyze } = useFaceLandmarker();
  const [hint, setHint] = useState<string | null>('Loading face detector…');
  const lastAnalysis = useRef<FaceAnalysis | null>(null);

  useEffect(() => {
    if (error) {
      setHint(null);
      return;
    }
    if (!enabled || !ready) return;
    let raf = 0;
    const loop = () => {
      const video = videoRef.current;
      if (video) {
        const a = analyze(video);
        if (a) {
          lastAnalysis.current = a;
          setHint(checkTarget(target, a));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, ready, error, target, analyze, videoRef]);

  // Re-validate on demand at capture time; returns an error string or null.
  const validateNow = useCallback((): string | null => {
    if (error || !ready) return null; // fail open
    const video = videoRef.current;
    if (!video) return null;
    const a = analyze(video) ?? lastAnalysis.current;
    if (!a) return null;
    return checkTarget(target, a);
  }, [analyze, target, videoRef, error, ready]);

  return { detectorReady: ready, detectorError: error, hint, validateNow };
}
