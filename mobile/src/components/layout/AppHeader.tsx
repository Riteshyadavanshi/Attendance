import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { useTheme } from '../../hooks/useTheme';
import { useSafeInsets } from '../../hooks/useSafeInsets';
import { spacing } from '../../theme/colors';

type Props = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({ title = 'HR Attendance', subtitle }: Props) {
  const { colors } = useTheme();
  const { top } = useSafeInsets();
  const openSidebar = useSidebarStore((s) => s.openSidebar);
  const isHr = useAuthStore((s) => s.isHr);
  const user = useAuthStore((s) => s.user);
  const initial = (user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const greeting = subtitle ?? (user?.full_name ? `Hi, ${user.full_name.split(' ')[0]}` : undefined);
  const showMenu = isHr();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.headerBg, paddingTop: top + spacing.sm }]}>
      <View style={styles.row}>
        {showMenu ? (
          <Pressable onPress={openSidebar} style={styles.menuBtn} hitSlop={8}>
            <Ionicons name="menu" size={26} color={colors.headerText} />
          </Pressable>
        ) : (
          <View style={styles.logo}>
            <Ionicons name="finger-print" size={22} color={colors.headerText} />
          </View>
        )}

        <View style={styles.brandText}>
          <Text style={[styles.title, { color: colors.headerText }]} numberOfLines={1}>
            {title}
          </Text>
          {greeting ? <Text style={styles.subtitle}>{greeting}</Text> : null}
        </View>

        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.headerText }]}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 15 },
});
