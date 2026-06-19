import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { radii, spacing } from '../../theme/colors';

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { colors } = useTheme();

  return (
    <TabShell title="Profile">
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.full_name}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
      </View>

      <Card>
        <Text style={[styles.section, { color: colors.textMuted }]}>Roles</Text>
        <View style={styles.roles}>
          {(user?.roles ?? []).map((role) => (
            <View key={role} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.chipText, { color: colors.primary }]}>{role.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.themeRow}>
          <View>
            <Text style={[styles.sectionDark, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.themeSub, { color: colors.textMuted }]}>Light or dark theme</Text>
          </View>
          <ThemeToggle />
        </View>
      </Card>

      <View style={styles.logout}>
        <Button label="Sign Out" variant="danger" onPress={logout} />
      </View>
    </TabShell>
  );
}

const styles = StyleSheet.create({
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 22, fontWeight: '800' },
  email: { marginTop: 4, fontSize: 14 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionDark: { fontSize: 15, fontWeight: '700' },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full },
  chipText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeSub: { marginTop: 4, fontSize: 13 },
  logout: { marginTop: spacing.md },
});
