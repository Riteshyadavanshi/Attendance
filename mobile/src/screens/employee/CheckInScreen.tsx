import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useFaceCapture } from '../../hooks/useFaceCapture';
import { useLocation } from '../../hooks/useLocation';
import { attendanceApi, officeLocationApi, type OfficeLocation } from '../../services/api';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { distanceMeters, isInsideGeofence } from '../../utils/geofence';
import { radii, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'CheckIn'>;

export function CheckInScreen({ route, navigation }: Props) {
  const mode = route.params.mode;
  const { colors } = useTheme();
  const { capturing, lastImage, captureFace } = useFaceCapture();
  const { coords, loading: locLoading, error: locError, getCurrentLocation } = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [geofence, setGeofence] = useState<OfficeLocation | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

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

  const onSubmit = async () => {
    const faceImage = lastImage || (await captureFace());
    if (!faceImage) {
      Alert.alert('Face required', 'Capture your face to continue.');
      return;
    }
    let location = coords;
    if (!location) {
      try {
        location = await getCurrentLocation();
      } catch {
        Alert.alert('Location required', 'Enable GPS for geofenced check-in.');
        return;
      }
    }
    if (location.accuracy != null && location.accuracy > 50) {
      try {
        location = await getCurrentLocation();
      } catch {
        // keep previous reading
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
      Alert.alert(
        'Outside geofence',
        `You are ${dist}m from the office. Must be within ${geofence.radius_meters}m.`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        face_image: faceImage,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        device_info: { screen: 'CheckInScreen' },
      };
      if (mode === 'in') {
        await attendanceApi.checkIn(payload);
        Alert.alert('Success', 'Checked in successfully');
      } else {
        await attendanceApi.checkOut(payload);
        Alert.alert('Success', 'Checked out successfully');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(mode === 'in' ? 'Check-in failed' : 'Check-out failed', e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = capturing || locLoading || submitting;
  const canSubmit = insideGeofence !== false;

  return (
    <StackShell title={mode === 'in' ? 'Check In' : 'Check Out'}>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Capture your face and confirm office geofence.
      </Text>

      <View style={[styles.previewBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {lastImage ? (
          <Image source={{ uri: `data:image/jpeg;base64,${lastImage}` }} style={styles.preview} />
        ) : (
          <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        )}
      </View>

      {geofence && (
        <Text style={[styles.coords, { color: colors.textSecondary }]}>Office: {geofence.name}</Text>
      )}
      {insideGeofence === false && geofence ? (
        <Text style={[styles.warn, { color: colors.warning }]}>
          Outside the office area. Move closer to {geofence.name} to continue.
        </Text>
      ) : null}
      {insideGeofence === true ? (
        <Text style={[styles.ok, { color: colors.success }]}>You are at the office location.</Text>
      ) : null}
      {coords?.accuracy != null && coords.accuracy > 50 && insideGeofence !== true ? (
        <Text style={[styles.warn, { color: colors.warning }]}>
          Location signal is weak. Try near a window, then refresh GPS.
        </Text>
      ) : null}
      {locError ? <Text style={[styles.warn, { color: colors.warning }]}>{locError}</Text> : null}

      {busy ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.actions}>
          <Button label="Refresh GPS" variant="secondary" onPress={() => getCurrentLocation()} />
          <Button label="Capture Face" variant="secondary" onPress={() => captureFace()} />
          <Button
            label={mode === 'in' ? 'Confirm Check In' : 'Confirm Check Out'}
            variant={mode === 'out' ? 'danger' : 'primary'}
            onPress={onSubmit}
            disabled={!canSubmit || (insideGeofence === null && !!geofence)}
          />
        </View>
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  sub: { marginBottom: spacing.md, fontSize: 14 },
  previewBox: {
    height: 260,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  coords: { marginTop: spacing.sm, fontSize: 13 },
  warn: { marginTop: 4, fontSize: 13 },
  ok: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  loader: { marginTop: spacing.lg },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
