'use client';

import { useEffect, useRef, useState } from 'react';

import { IdentityForm, type IdentityFormHandle } from '@/components/face/IdentityForm';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useLiveFaceValidation } from '@/hooks/useFaceLandmarker';
import { useWebcam } from '@/hooks/useWebcam';
import { faceApi } from '@/lib/api';

const ANGLES = [
  { key: 'front', label: 'Front', hint: 'Look straight at the camera' },
  { key: 'left', label: 'Left', hint: 'Turn slightly left' },
  { key: 'right', label: 'Right', hint: 'Turn slightly right' },
  { key: 'up', label: 'Up', hint: 'Tilt slightly up' },
  { key: 'down', label: 'Down', hint: 'Tilt slightly down' },
] as const;

type AngleKey = (typeof ANGLES)[number]['key'];

export default function FaceEnrollPage() {
  const { videoRef, ready, error, start, captureBase64 } = useWebcam();
  const toast = useToast();
  const identityRef = useRef<IdentityFormHandle>(null);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Partial<Record<AngleKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const current = ANGLES[step];
  const allCaptured = ANGLES.every((a) => images[a.key]);
  const preview = images[current.key];

  const { detectorError, hint, validateNow } = useLiveFaceValidation(
    videoRef,
    current.key,
    ready && !preview,
  );

  useEffect(() => {
    start();
  }, [start]);

  const onCapture = () => {
    if (preview) {
      setImages((prev) => ({ ...prev, [current.key]: undefined }));
      return;
    }
    const err = validateNow();
    if (err) {
      toast.warning(err);
      return;
    }
    const b64 = captureBase64();
    if (!b64) return;
    setImages((prev) => ({ ...prev, [current.key]: b64 }));
    if (step < ANGLES.length - 1) setStep((s) => s + 1);
  };

  const onSubmit = async () => {
    if (!allCaptured) {
      toast.warning('Capture all five angles.');
      return;
    }
    setSubmitting(true);
    try {
      await identityRef.current?.save();
      await faceApi.enroll({
        front: images.front!,
        left: images.left!,
        right: images.right!,
        up: images.up!,
        down: images.down!,
      });
      toast.success('Face enrollment complete!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Enrollment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const poseReady = !preview && !hint;

  return (
    <>
      <PageHeader
        title="Face enrollment"
        description="Confirm your details, then capture five angles for verification."
      />

      <Card>
        <IdentityForm
          ref={identityRef}
          description="Confirm your details before enrolling your face. Employee ID can't be changed."
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <p className="font-semibold text-primary">
            Step {step + 1}/{ANGLES.length}: {current.label}
          </p>
          <p className="text-sm text-muted-foreground">{current.hint}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/jpeg;base64,${preview}`}
              alt="Preview"
              className="h-72 w-full object-cover transform-[scaleX(-1)]"
            />
          ) : (
            <video ref={videoRef} className="h-72 w-full object-cover transform-[scaleX(-1)]" playsInline muted />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {error && <p className="text-sm text-warning">{error}</p>}
          {!error && !preview && (
            <p className={`text-sm font-medium ${hint ? 'text-warning' : 'text-success'}`}>
              {hint ?? 'Great — hold still and capture.'}
            </p>
          )}
          {detectorError && (
            <p className="text-xs text-muted-foreground">
              Face check unavailable — capturing without pose validation.
            </p>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {ANGLES.map((a, i) => (
            <span
              key={a.key}
              className={`h-2.5 w-2.5 rounded-full ${images[a.key] ? 'bg-success' : i === step ? 'bg-primary' : 'bg-muted-foreground/40'}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onCapture} disabled={!ready || submitting || (!preview && !poseReady)}>
            {preview ? `Retake ${current.label}` : `Capture ${current.label}`}
          </Button>
          {allCaptured && (
            <Button variant="secondary" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit enrollment'}
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
