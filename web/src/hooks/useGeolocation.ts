'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type GeoCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<GeoCoords> => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported in this browser.';
      setError(msg);
      throw new Error(msg);
    }
    setLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          };
          setCoords(result);
          setLoading(false);
          resolve(result);
        },
        (err) => {
          const msg = err.message || 'Could not get location.';
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    });
  }, []);

  useEffect(() => {
    getCurrentLocation().catch(() => undefined);
  }, [getCurrentLocation]);

  return { coords, loading, error, getCurrentLocation };
}
