import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { attendanceApi } from '../../services/api';
import { formatDate, formatStatus, formatTime } from '../../utils/formatDateTime';
import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme/colors';

export function AttendanceHistoryScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    attendanceApi.history().then(setRecords).catch(() => setRecords([]));
  }, []);

  return (
    <TabShell title="History" scroll={false} contentStyle={styles.shell}>
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No records yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={[styles.date, { color: colors.text }]}>{formatDate(item.date)}</Text>
            <Text style={[styles.status, { color: colors.primary }]}>{formatStatus(item.status)}</Text>
            {item.check_in_at != null && (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                In: {formatTime(item.check_in_at)}
                {item.check_out_at != null ? ` · Out: ${formatTime(item.check_out_at)}` : ''}
              </Text>
            )}
            {item.working_minutes != null && (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {String(item.working_minutes)} min worked
              </Text>
            )}
          </Card>
        )}
      />
    </TabShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 0, flex: 1 },
  list: { paddingBottom: spacing.lg },
  card: { marginBottom: spacing.sm },
  date: { fontWeight: '700', fontSize: 16 },
  status: { textTransform: 'capitalize', marginTop: 4, fontWeight: '600' },
  meta: { marginTop: 4, fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyText: { fontSize: 15 },
});
