import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { DEV_OFFICE_COORDS } from '../constants/config';

export type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export function useLocation() {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(
    (useDevFallback = true): Promise<LocationCoords> =>
      new Promise(async (resolve, reject) => {
        setLoading(true);
        setError(null);

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            if (useDevFallback && __DEV__) {
              const fallback = DEV_OFFICE_COORDS;
              setCoords(fallback);
              setError('Using dev office coordinates (location denied)');
              setLoading(false);
              resolve(fallback);
              return;
            }
            throw new Error('Location permission denied');
          }

          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            mayShowUserSettingsDialog: true,
          });

          const result: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
          };
          setCoords(result);
          setLoading(false);
          resolve(result);
        } catch (err) {
          setLoading(false);
          if (useDevFallback && __DEV__) {
            const fallback = DEV_OFFICE_COORDS;
            setCoords(fallback);
            setError('Using dev office coordinates');
            resolve(fallback);
            return;
          }
          const message = err instanceof Error ? err.message : 'Unable to get location';
          setError(message);
          reject(new Error(message));
        }
      }),
    [],
  );

  return { coords, loading, error, getCurrentLocation };
}

export const locationPermissionHint =
  Platform.OS === 'android'
    ? 'Enable location permission in Settings for geofenced check-in.'
    : 'Enable location permission for geofenced check-in.';
