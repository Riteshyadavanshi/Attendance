import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { attendanceApi } from '../../services/api';
import { LateRankList } from '../../components/hr/LateLeaderboardList';
import type { LateTodayEntry } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { radii, spacing } from '../../theme/colors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
};

function ActionCard({ title, subtitle, icon, onPress, colors }: ActionCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.actionCard} accent>
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name={icon} size={22} color="#FFF" />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.actionSub, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

export function HRDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [lateToday, setLateToday] = useState<LateTodayEntry[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const data = await attendanceApi.dashboard();
      setStats(data);
      const embedded = data.late_today ?? data.late_leaderboard;
      if (Array.isArray(embedded)) {
        setLateToday((embedded as LateTodayEntry[]).slice(0, 5));
      }
    } catch {
      setStats({});
    }

    try {
      const today = await attendanceApi.lateToday();
      setLateToday((today.items ?? []).slice(0, 5));
    } catch {
      // optional if backend not restarted
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const widgets = [
    { label: 'Total Employees', value: stats.total_employees, color: colors.primary },
    { label: 'Present Today', value: stats.present, color: colors.success },
    { label: 'Absent Today', value: stats.absent, color: colors.danger },
    {
      label: 'Late Today',
      value: stats.late,
      color: colors.warning,
      onPress: () => navigation.navigate('LateToday'),
    },
  ];

  return (
    <TabShell title="HR Dashboard" subtitle="Today's overview">
      <View style={styles.grid}>
        {widgets.map((w) => {
          const card = (
            <StatCard
              label={w.label}
              value={String(w.value ?? '—')}
              color={w.color}
              style={styles.statInner}
            />
          );
          if ('onPress' in w && w.onPress) {
            return (
              <Pressable key={w.label} style={styles.stat} onPress={w.onPress}>
                {card}
              </Pressable>
            );
          }
          return (
            <View key={w.label} style={styles.stat}>
              {card}
            </View>
          );
        })}
      </View>

      <View style={styles.lateSection}>
        <View style={styles.lateHeader}>
          <Text style={[styles.section, { color: colors.textMuted, marginBottom: 0 }]}>Late today</Text>
          <Pressable onPress={() => navigation.navigate('LateToday')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>
        <LateRankList mode="today" items={lateToday} colors={colors} compact />
      </View>

      <Text style={[styles.section, { color: colors.textMuted }]}>Quick actions</Text>

      <ActionCard
        title="Late Leaderboard"
        subtitle="All-time company ranking — most late days"
        icon="trophy-outline"
        colors={colors}
        onPress={() => navigation.navigate('LateLeaderboard')}
      />

      <ActionCard
        title="All Employees"
        subtitle="Browse and search the employee directory"
        icon="people-outline"
        colors={colors}
        onPress={() => navigation.navigate('EmployeeList')}
      />

      <ActionCard
        title="Register Employee"
        subtitle="Add a new employee account"
        icon="person-add-outline"
        colors={colors}
        onPress={() => navigation.navigate('RegisterEmployee')}
      />

      <ActionCard
        title="Work Hours"
        subtitle="Set check-in, check-out, and late rules"
        icon="time-outline"
        colors={colors}
        onPress={() => navigation.navigate('AttendanceRules')}
      />

      <ActionCard
        title="Feedback Forms"
        subtitle="Create forms and view response dashboards"
        icon="chatbox-ellipses-outline"
        colors={colors}
        onPress={() => navigation.navigate('FeedbackFormsList')}
      />
    </TabShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  stat: { width: '47%', minWidth: 140 },
  statInner: { marginBottom: 0 },
  lateSection: { marginBottom: spacing.lg },
  lateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  seeAll: { fontSize: 13, fontWeight: '700' },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  actionCard: { marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700' },
  actionSub: { fontSize: 13, marginTop: 2 },
});
