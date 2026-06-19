import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useFaceCapture } from '../../hooks/useFaceCapture';
import { faceApi } from '../../services/api';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { radii, spacing } from '../../theme/colors';

const ANGLES = [
  { key: 'front', label: 'Front', hint: 'Look straight at the camera' },
  { key: 'left', label: 'Left', hint: 'Turn slightly left' },
  { key: 'right', label: 'Right', hint: 'Turn slightly right' },
  { key: 'up', label: 'Up', hint: 'Tilt slightly up' },
  { key: 'down', label: 'Down', hint: 'Tilt slightly down' },
] as const;

type AngleKey = (typeof ANGLES)[number]['key'];
type Props = NativeStackScreenProps<MainStackParamList, 'FaceEnroll'>;

export function FaceEnrollScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { capturing, captureFace } = useFaceCapture();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Partial<Record<AngleKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const current = ANGLES[step];
  const allCaptured = ANGLES.every((a) => images[a.key]);
  const preview = images[current.key];

  const onCapture = async () => {
    const base64 = await captureFace();
    if (!base64) return;
    setImages((prev) => ({ ...prev, [current.key]: base64 }));
    if (step < ANGLES.length - 1) setStep((s) => s + 1);
  };

  const onSubmit = useCallback(async () => {
    if (!allCaptured) {
      Alert.alert('Incomplete', 'Capture all five angles.');
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
      Alert.alert('Success', 'Face enrollment complete.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }, [allCaptured, images, navigation]);

  return (
    <StackShell title="Face Enrollment">
      <Text style={[styles.step, { color: colors.primary }]}>
        Step {step + 1}/{ANGLES.length}: {current.label}
      </Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{current.hint}</Text>

      <View style={[styles.previewBox, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {preview ? (
          <Image source={{ uri: `data:image/jpeg;base64,${preview}` }} style={styles.preview} />
        ) : (
          <Ionicons name="scan-outline" size={48} color={colors.textMuted} />
        )}
      </View>

      <View style={styles.dots}>
        {ANGLES.map((a, i) => (
          <View
            key={a.key}
            style={[
              styles.dot,
              { backgroundColor: colors.chipBg },
              images[a.key] && { backgroundColor: colors.success },
              i === step && { backgroundColor: colors.primary, transform: [{ scale: 1.2 }] },
            ]}
          />
        ))}
      </View>

      {capturing || submitting ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <View style={styles.actions}>
          <Button label={preview ? `Retake ${current.label}` : `Capture ${current.label}`} onPress={onCapture} />
          {allCaptured && <Button label="Submit Enrollment" onPress={onSubmit} variant="secondary" />}
        </View>
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  step: { fontSize: 16, fontWeight: '700' },
  hint: { marginTop: 4 },
  previewBox: {
    marginTop: spacing.lg,
    height: 280,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
});
