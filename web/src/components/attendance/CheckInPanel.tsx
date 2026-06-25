'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWebcam } from '@/hooks/useWebcam';
import { attendanceApi } from '@/lib/api';

export function CheckInPanel({ mode }: { mode: 'in' | 'out' }) {
  const { videoRef, ready, error: camError, start, captureBase64 } = useWebcam();
  const { coords, loading: locLoading, error: locError, getCurrentLocation } = useGeolocation();
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    start();
  }, [start]);

  const onCapture = () => {
    const b64 = captureBase64();
    if (b64) setPreview(b64);
  };

  const onSubmit = async () => {
    const faceImage = preview ?? captureBase64();
    if (!faceImage) {
      toast.warning('Capture your face first.');
      return;
    }
    let location = coords;
    if (!location) {
      try {
        location = await getCurrentLocation();
      } catch {
        toast.warning('Enable location for geofenced check-in.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        face_image: faceImage,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy ?? undefined,
        device_info: { screen: 'WebCheckIn' },
      };
      if (mode === 'in') await attendanceApi.checkIn(payload);
      else await attendanceApi.checkOut(payload);
      toast.success(mode === 'in' ? 'Checked in successfully!' : 'Checked out successfully!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <p className="text-sm text-muted-foreground">
        {mode === 'in' ? 'Check in with face verification and office geofence.' : 'Check out with face verification.'}
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-slate-950">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/jpeg;base64,${preview}`}
            alt="Captured face"
            className="h-64 w-full object-cover transform-[scaleX(-1)]"
          />
        ) : (
          <video ref={videoRef} className="h-64 w-full object-cover transform-[scaleX(-1)]" playsInline muted />
        )}
      </div>
      {!ready && !camError && <p className="mt-2 text-sm text-muted-foreground">Starting camera…</p>}
      {camError && <p className="mt-2 text-sm text-warning">{camError}</p>}
      {coords && (
        <p className="mt-2 text-xs text-muted-foreground">
          GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          {coords.accuracy != null ? ` (±${Math.round(coords.accuracy)}m)` : ''}
        </p>
      )}
      {coords?.accuracy != null && coords.accuracy > 50 && (
        <p className="mt-1 text-xs text-warning">GPS is weak. Try near a window, then refresh location.</p>
      )}
      {locError && <p className="mt-1 text-xs text-warning">{locError}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => getCurrentLocation()} disabled={locLoading}>
          Refresh GPS
        </Button>
        <Button variant="secondary" onClick={onCapture} disabled={!ready}>
          Capture face
        </Button>
        <Button variant={mode === 'out' ? 'danger' : 'primary'} onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : mode === 'in' ? 'Confirm check in' : 'Confirm check out'}
        </Button>
      </div>
    </Card>
  );
}
