import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { attendanceApi, faceApi } from '../../services/api';
import { formatStatus, formatTime } from '../../utils/formatDateTime';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { spacing } from '../../theme/colors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [today, setToday] = useState<Record<string, unknown> | null>(null);
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);

  const loadToday = useCallback(async () => {
    try {
      const data = await attendanceApi.today();
      setToday(data);
    } catch {
      setToday({ status: 'not_checked_in' });
    }
  }, []);

  const loadFaceStatus = useCallback(async () => {
    try {
      const status = await faceApi.status();
      setFaceEnrolled(status.face_enrolled);
    } catch {
      setFaceEnrolled(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadToday();
      loadFaceStatus();
    }, [loadToday, loadFaceStatus]),
  );

  const checkedIn = today?.check_in_at;
  const checkedOut = today?.check_out_at;
  const status = String(today?.status ?? 'loading');

  const statusColor =
    status === 'present' || status === 'late'
      ? colors.success
      : status === 'not_checked_in'
        ? colors.textMuted
        : colors.primary;

  return (
    <TabShell title="Home">
      {faceEnrolled === false && (
        <Card accent style={styles.banner}>
          <View style={styles.bannerRow}>
            <Ionicons name="scan-outline" size={28} color={colors.primary} />
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: colors.text }]}>Face enrollment required</Text>
              <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
                Complete 5-angle setup to check in
              </Text>
            </View>
          </View>
          <Button label="Enroll Now" onPress={() => navigation.navigate('FaceEnroll')} />
        </Card>
      )}

      <Card>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Today's status</Text>
        <Text style={[styles.status, { color: statusColor }]}>{formatStatus(status)}</Text>
        {checkedIn != null && checkedIn !== '' ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            In: {formatTime(today?.check_in_at)}
          </Text>
        ) : null}
        {checkedOut != null && checkedOut !== '' ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Out: {formatTime(today?.check_out_at)}
          </Text>
        ) : null}
      </Card>

      <View style={styles.actions}>
        {!Boolean(checkedIn) && (
          <Button
            label="Check In"
            icon={<Ionicons name="log-in-outline" size={20} color="#FFF" />}
            onPress={() => navigation.navigate('CheckIn', { mode: 'in' })}
            disabled={faceEnrolled === false}
          />
        )}
        {Boolean(checkedIn) && !Boolean(checkedOut) && (
          <Button
            label="Check Out"
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
            onPress={() => navigation.navigate('CheckIn', { mode: 'out' })}
          />
        )}
        <Button
          label="Update face enrollment"
          variant="outline"
          onPress={() => navigation.navigate('FaceEnroll')}
        />
      </View>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.sm },
  bannerRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700' },
  bannerSub: { marginTop: 4, fontSize: 13 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  status: { fontSize: 28, fontWeight: '800', marginTop: spacing.sm, textTransform: 'capitalize' },
  meta: { marginTop: spacing.sm, fontSize: 14 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
