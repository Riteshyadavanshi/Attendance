import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  accent?: boolean;
};

export function Card({ children, style, accent }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primarySoft : colors.card,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
          elevation: isDark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type StatProps = {
  label: string;
  value: string | number;
  color?: string;
  style?: ViewStyle;
};

export function StatCard({ label, value, color, style }: StatProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.stat, style]}>
      <Text style={[styles.statValue, { color: color ?? colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  stat: { width: '47%', minWidth: 140 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { marginTop: 4, fontSize: 12, fontWeight: '500' },
});
