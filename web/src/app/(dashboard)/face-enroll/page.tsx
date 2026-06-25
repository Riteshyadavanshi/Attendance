'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
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
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Partial<Record<AngleKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const current = ANGLES[step];
  const allCaptured = ANGLES.every((a) => images[a.key]);
  const preview = images[current.key];

  useEffect(() => {
    start();
  }, [start]);

  const onCapture = () => {
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Face enrollment</h1>
      <Card>
        <p className="font-semibold text-primary">
          Step {step + 1}/{ANGLES.length}: {current.label}
        </p>
        <p className="text-sm text-muted-foreground">{current.hint}</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-slate-950">
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
        {error && <p className="mt-2 text-sm text-warning">{error}</p>}
        <div className="mt-3 flex justify-center gap-2">
          {ANGLES.map((a, i) => (
            <span
              key={a.key}
              className={`h-2.5 w-2.5 rounded-full ${images[a.key] ? 'bg-success' : i === step ? 'bg-primary' : 'bg-muted-foreground/40'}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onCapture} disabled={!ready || submitting}>
            {preview ? `Retake ${current.label}` : `Capture ${current.label}`}
          </Button>
          {allCaptured && (
            <Button variant="secondary" onClick={onSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit enrollment'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
