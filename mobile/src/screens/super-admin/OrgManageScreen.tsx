import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { radii, spacing } from '../../theme/colors';
import type { MainStackParamList } from '../../navigation/MainTabs';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function OrgManageScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  return (
    <TabShell title="Admin" subtitle="Organization settings">
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Manage org settings, departments, and geofencing.
      </Text>

      <Pressable onPress={() => navigation.navigate('GeofenceConfig')}>
        <Card style={styles.menuCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Geofence Locations</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>
              Office coordinates & 300m radius
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </Card>
      </Pressable>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  sub: { marginBottom: spacing.md, fontSize: 14 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { marginTop: 2, fontSize: 13 },
});
