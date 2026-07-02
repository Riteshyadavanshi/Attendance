'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useLiveFaceValidation } from '@/hooks/useFaceLandmarker';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWebcam } from '@/hooks/useWebcam';
import { attendanceApi, officeLocationApi, type OfficeLocation } from '@/lib/api';
import { distanceMeters, isInsideGeofence } from '@/lib/geofence';

export function CheckInPanel({ mode }: { mode: 'in' | 'out' }) {
  const { videoRef, ready, error: camError, start, captureBase64 } = useWebcam();
  const { coords, loading: locLoading, error: locError, getCurrentLocation } = useGeolocation();
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geofence, setGeofence] = useState<OfficeLocation | null>(null);

  const { detectorError, hint, validateNow } = useLiveFaceValidation(videoRef, 'presence', ready && !preview);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    officeLocationApi.current().then(setGeofence).catch(() => setGeofence(null));
  }, []);

  const insideGeofence =
    coords && geofence
      ? isInsideGeofence(
          coords.latitude,
          coords.longitude,
          geofence.latitude,
          geofence.longitude,
          geofence.radius_meters,
        )
      : null;

  const onCapture = () => {
    if (preview) {
      setPreview(null);
      return;
    }
    const err = validateNow();
    if (err) {
      toast.warning(err);
      return;
    }
    const b64 = captureBase64();
    if (b64) setPreview(b64);
  };

  const onSubmit = async () => {
    if (!preview) {
      const err = validateNow();
      if (err) {
        toast.warning(err);
        return;
      }
    }
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
    if (geofence && !isInsideGeofence(
      location.latitude,
      location.longitude,
      geofence.latitude,
      geofence.longitude,
      geofence.radius_meters,
    )) {
      const dist = Math.round(
        distanceMeters(location.latitude, location.longitude, geofence.latitude, geofence.longitude),
      );
      toast.warning(`You are ${dist}m from the office. Must be within ${geofence.radius_meters}m to ${mode === 'in' ? 'check in' : 'check out'}.`);
      return;
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

  const canSubmit = insideGeofence !== false && !submitting;

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
      {camError && (
        <p className="mt-2 text-sm font-medium text-warning">
          {camError}
        </p>
      )}
      {ready && !camError && !preview && (
        <p className={`mt-2 text-sm font-medium ${hint ? 'text-warning' : 'text-success'}`}>
          {hint ?? 'Face detected — ready to capture.'}
        </p>
      )}
      {detectorError && (
        <p className="mt-1 text-xs text-muted-foreground">
          Face check unavailable — capturing without validation.
        </p>
      )}
      {geofence && (
        <p className="mt-2 text-xs text-muted-foreground">Office: {geofence.name}</p>
      )}
      {insideGeofence === false && geofence && (
        <p className="mt-1 text-xs font-medium text-warning">
          You are outside the office area. Move closer to {geofence.name} to {mode === 'in' ? 'check in' : 'check out'}.
        </p>
      )}
      {insideGeofence === true && (
        <p className="mt-1 text-xs font-medium text-success">You are at the office location.</p>
      )}
      {!geofence && coords && (
        <p className="mt-1 text-xs text-muted-foreground">Verifying your location…</p>
      )}
      {coords?.accuracy != null && coords.accuracy > 50 && insideGeofence !== true && (
        <p className="mt-1 text-xs text-warning">Location signal is weak. Try near a window, then refresh.</p>
      )}
      {locError && <p className="mt-1 text-xs text-warning">{locError}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {camError && (
          <Button variant="outline" onClick={() => start()}>
            Retry camera
          </Button>
        )}
        <Button variant="outline" onClick={() => getCurrentLocation()} disabled={locLoading}>
          Refresh GPS
        </Button>
        <Button
          variant="secondary"
          onClick={onCapture}
          disabled={!ready || (!preview && !!hint)}
        >
          {preview ? 'Retake face' : 'Capture face'}
        </Button>
        <Button
          variant={mode === 'out' ? 'danger' : 'primary'}
          onClick={onSubmit}
          disabled={!canSubmit || (insideGeofence === null && !!geofence)}
        >
          {submitting ? 'Submitting…' : mode === 'in' ? 'Confirm check in' : 'Confirm check out'}
        </Button>
      </div>
    </Card>
  );
}
