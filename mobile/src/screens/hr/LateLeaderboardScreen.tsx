import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { attendanceApi } from '../../services/api';
import { LateRankList } from '../../components/hr/LateLeaderboardList';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme/colors';
import type { LateLeaderboardEntry } from '../../services/api';

export function LateLeaderboardScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [items, setItems] = useState<LateLeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.lateLeaderboard();
      setTotalDays(data.total_late_days ?? 0);
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
      <StackShell title="Late Leaderboard">
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </StackShell>
    );
  }

  return (
    <StackShell title="Late Leaderboard" scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.content}
      >
        <Card accent>
          <Text style={[styles.heading, { color: colors.text }]}>Company late leaderboard</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            All-time · {totalDays} total late day{totalDays === 1 ? '' : 's'} recorded
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Ranked by number of late days since the beginning. #1 has the most late arrivals.
          </Text>
        </Card>

        <LateRankList mode="overall" items={items} colors={colors} />

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
