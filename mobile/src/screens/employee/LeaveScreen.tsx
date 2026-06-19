import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme/colors';

export function LeaveScreen() {
  const { colors } = useTheme();

  return (
    <TabShell title="Leave">
      <Card>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="airplane-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Coming soon</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Apply and track leave requests from this screen.
            </Text>
          </View>
        </View>
      </Card>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  sub: { marginTop: 4, fontSize: 14, lineHeight: 20 },
});
