import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme/colors';

const kpis = [
  { label: 'Attendance Rate', value: '94%', icon: 'trending-up' as const },
  { label: 'Avg. Hours', value: '8.2h', icon: 'time' as const },
  { label: 'Departments', value: '5', icon: 'business' as const },
];

export function ExecutiveDashboardScreen() {
  const { colors } = useTheme();

  return (
    <TabShell title="Insights" subtitle="Executive KPIs">
      <View style={styles.grid}>
        {kpis.map((k) => (
          <Card key={k.label} style={styles.kpi}>
            <Ionicons name={k.icon} size={24} color={colors.primary} />
            <Text style={[styles.kpiValue, { color: colors.text }]}>{k.value}</Text>
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{k.label}</Text>
          </Card>
        ))}
      </View>

      <Card>
        <Text style={[styles.section, { color: colors.text }]}>AI Analytics</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Department trends, risk alerts, and workforce forecasts will appear here.
        </Text>
      </Card>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  kpi: { width: '31%', minWidth: 100, alignItems: 'center' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginTop: spacing.sm },
  kpiLabel: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  section: { fontSize: 17, fontWeight: '700' },
  sub: { marginTop: spacing.sm, lineHeight: 20, fontSize: 14 },
});
