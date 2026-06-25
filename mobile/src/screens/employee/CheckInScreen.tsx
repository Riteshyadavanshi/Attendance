import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useFaceCapture } from '../../hooks/useFaceCapture';
import { useLocation } from '../../hooks/useLocation';
import { attendanceApi } from '../../services/api';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { IdentityForm, type IdentityFormHandle } from '../../components/face/IdentityForm';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { radii, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'CheckIn'>;

export function CheckInScreen({ route, navigation }: Props) {
  const mode = route.params.mode;
  const { colors } = useTheme();
  const { capturing, lastImage, captureFace } = useFaceCapture();
  const { coords, loading: locLoading, error: locError, getCurrentLocation } = useLocation();
  const identityRef = useRef<IdentityFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

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
    setSubmitting(true);
    try {
      const payload = {
        face_image: faceImage,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        device_info: { screen: 'CheckInScreen' },
      };
      await identityRef.current?.save();
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

  return (
    <StackShell title={mode === 'in' ? 'Check In' : 'Check Out'}>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Capture your face and confirm office geofence.
      </Text>

      <Card style={{ marginBottom: spacing.md }}>
        <IdentityForm ref={identityRef} />
      </Card>

      <View style={[styles.previewBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {lastImage ? (
          <Image source={{ uri: `data:image/jpeg;base64,${lastImage}` }} style={styles.preview} />
        ) : (
          <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        )}
      </View>

      {coords && (
        <Text style={[styles.coords, { color: colors.textSecondary }]}>
          GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          {coords.accuracy != null ? ` (±${Math.round(coords.accuracy)}m)` : ''}
        </Text>
      )}
      {coords?.accuracy != null && coords.accuracy > 50 ? (
        <Text style={[styles.warn, { color: colors.warning }]}>
          GPS is weak (need ±50m or better). Go near a window or outdoors, then tap Refresh GPS.
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
  loader: { marginTop: spacing.lg },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
