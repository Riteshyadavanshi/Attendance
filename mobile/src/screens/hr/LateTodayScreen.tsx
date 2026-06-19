import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { attendanceApi } from '../../services/api';
import { LateRankList } from '../../components/hr/LateLeaderboardList';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme/colors';
import type { LateTodayEntry } from '../../services/api';

export function LateTodayScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState('');
  const [lateAfter, setLateAfter] = useState('');
  const [items, setItems] = useState<LateTodayEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.lateToday();
      setDate(data.date);
      setLateAfter(data.late_after_time);
      setItems(data.items ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !refreshing) {
    return (
      <StackShell title="Late Today">
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </StackShell>
    );
  }

  return (
    <StackShell title="Late Today" scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.content}
      >
        <Card accent>
          <Text style={[styles.heading, { color: colors.text }]}>Who is late today</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {date ? `Date: ${date}` : ''}
            {lateAfter ? ` · Late after ${lateAfter}` : ''}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Employees who checked in after the grace window today.
          </Text>
        </Card>

        <LateRankList mode="today" items={items} colors={colors} />

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            {error}. Pull down to refresh.
          </Text>
        ) : null}
      </ScrollView>
    </StackShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  heading: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },
  hint: { fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
  error: { fontSize: 13, marginTop: spacing.md, textAlign: 'center' },
});
