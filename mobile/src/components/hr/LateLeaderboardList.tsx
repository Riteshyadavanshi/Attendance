import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { LateLeaderboardEntry, LateTodayEntry } from '../../services/api';
import { formatDateTime, formatTime } from '../../utils/formatDateTime';
import { Card } from '../ui/Card';
import { radii, spacing } from '../../theme/colors';

export const RANK_COLORS = {
  1: { badge: '#EAB308', soft: '#FEF9C3', label: 'Gold' },
  2: { badge: '#94A3B8', soft: '#F1F5F9', label: 'Silver' },
  3: { badge: '#D97706', soft: '#FFEDD5', label: 'Bronze' },
} as const;

type Colors = {
  text: string;
  textMuted: string;
  textSecondary: string;
  cardBorder: string;
  surface: string;
};

function RankBadge({ rank }: { rank: number }) {
  const palette = RANK_COLORS[rank as 1 | 2 | 3];
  if (palette) {
    return (
      <View style={[styles.rankBadge, { backgroundColor: palette.badge }]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.rankBadge, styles.rankDefault]}>
      <Text style={[styles.rankBadgeText, styles.rankDefaultText]}>{rank}</Text>
    </View>
  );
}

function Podium({
  items,
  colors,
  metric,
}: {
  items: { rank: number; employee_name: string; metric: number }[];
  colors: Colors;
  metric: (n: number) => string;
}) {
  const topThree = items.filter((i) => i.rank <= 3);
  if (topThree.length === 0) return null;

  return (
    <View style={styles.podium}>
      {[2, 1, 3].map((rank) => {
        const entry = topThree.find((i) => i.rank === rank);
        if (!entry) return <View key={rank} style={styles.podiumSlot} />;
        const palette = RANK_COLORS[rank as 1 | 2 | 3];
        const height = rank === 1 ? 120 : rank === 2 ? 96 : 84;
        return (
          <View key={rank} style={[styles.podiumSlot, { height }]}>
            <View style={[styles.podiumCard, { backgroundColor: palette.soft, borderColor: palette.badge }]}>
              <RankBadge rank={rank} />
              <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                {entry.employee_name.split(' ')[0]}
              </Text>
              <Text style={[styles.podiumLate, { color: palette.badge }]}>{metric(entry.metric)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

type TodayProps = {
  mode: 'today';
  items: LateTodayEntry[];
  colors: Colors;
  compact?: boolean;
};

type OverallProps = {
  mode: 'overall';
  items: LateLeaderboardEntry[];
  colors: Colors;
  compact?: boolean;
};

export function LateRankList(props: TodayProps | OverallProps) {
  const { items, colors, compact } = props;

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="happy-outline" size={40} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {props.mode === 'today' ? 'No one is late today' : 'No late records yet'}
        </Text>
      </View>
    );
  }

  if (props.mode === 'today') {
    const todayItems = props.items;
    return (
      <View style={styles.wrap}>
        {!compact ? (
          <Podium
            colors={colors}
            metric={(n) => `+${n}m`}
            items={todayItems.map((e) => ({
              rank: e.rank,
              employee_name: e.employee_name,
              metric: e.minutes_late,
            }))}
          />
        ) : null}
        {todayItems.map((entry) => {
          const palette = RANK_COLORS[entry.rank as 1 | 2 | 3];
          return (
            <Card
              key={entry.employee_id}
              style={[
                styles.row,
                {
                  backgroundColor: palette?.soft ?? colors.surface,
                  borderColor: palette?.badge ?? colors.cardBorder,
                  borderWidth: palette ? 1.5 : 1,
                },
              ]}
            >
              <RankBadge rank={entry.rank} />
              <View style={styles.rowBody}>
                <Text style={[styles.name, { color: colors.text }]}>{entry.employee_name}</Text>
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {entry.employee_code}
                  {entry.designation ? ` · ${entry.designation}` : ''}
                </Text>
              </View>
              <View style={styles.rowEnd}>
                <Text style={[styles.lateMins, { color: palette?.badge ?? colors.textSecondary }]}>
                  +{entry.minutes_late} min
                </Text>
                <Text style={[styles.checkIn, { color: colors.textMuted }]}>
                  {formatTime(entry.check_in_at)}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>
    );
  }

  const overallItems = props.items;
  return (
    <View style={styles.wrap}>
      {!compact ? (
        <Podium
          colors={colors}
          metric={(n) => `${n} days`}
          items={overallItems.map((e) => ({
            rank: e.rank,
            employee_name: e.employee_name,
            metric: e.late_days,
          }))}
        />
      ) : null}
      {overallItems.map((entry) => {
        const palette = RANK_COLORS[entry.rank as 1 | 2 | 3];
        return (
          <Card
            key={entry.employee_id}
            style={[
              styles.row,
              {
                backgroundColor: palette?.soft ?? colors.surface,
                borderColor: palette?.badge ?? colors.cardBorder,
                borderWidth: palette ? 1.5 : 1,
              },
            ]}
          >
            <RankBadge rank={entry.rank} />
            <View style={styles.rowBody}>
              <Text style={[styles.name, { color: colors.text }]}>{entry.employee_name}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {entry.employee_code} · {entry.late_days} late day{entry.late_days === 1 ? '' : 's'}
              </Text>
            </View>
            <View style={styles.rowEnd}>
              <Text style={[styles.lateMins, { color: palette?.badge ?? colors.textSecondary }]}>
                {entry.total_minutes_late} min total
              </Text>
              <Text style={[styles.checkIn, { color: colors.textMuted }]}>
                Last: {entry.last_late_at ? formatDateTime(entry.last_late_at) : '—'}
              </Text>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

/** @deprecated use LateRankList */
export const LateLeaderboardList = LateRankList;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontSize: 14 },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  podiumSlot: { flex: 1, justifyContent: 'flex-end' },
  podiumCard: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  podiumName: { fontSize: 13, fontWeight: '700', maxWidth: '100%' },
  podiumLate: { fontSize: 12, fontWeight: '800' },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankDefault: { backgroundColor: '#E2E8F0' },
  rankBadgeText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  rankDefaultText: { color: '#475569' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: 0,
  },
  rowBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  rowEnd: { alignItems: 'flex-end' },
  lateMins: { fontSize: 14, fontWeight: '800' },
  checkIn: { fontSize: 11, marginTop: 2 },
});
