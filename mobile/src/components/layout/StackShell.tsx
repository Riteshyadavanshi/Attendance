import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { useTheme } from '../../hooks/useTheme';
import { useSafeInsets } from '../../hooks/useSafeInsets';
import { spacing } from '../../theme/colors';

type Props = {
  title: string;
  children: ReactNode;
  scroll?: boolean;
};

export function StackShell({ title, children, scroll = true }: Props) {
  const { colors } = useTheme();
  const { top, bottom } = useSafeInsets();
  const navigation = useNavigation();
  const openSidebar = useSidebarStore((s) => s.openSidebar);
  const isHr = useAuthStore((s) => s.isHr);

  const header = (
    <View style={[styles.header, { backgroundColor: colors.headerBg, paddingTop: top + spacing.sm }]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={colors.headerText} />
      </Pressable>
      <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
      {isHr() ? (
        <Pressable onPress={openSidebar} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="menu" size={24} color={colors.headerText} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );

  const body = (
    <View style={[styles.body, scroll ? undefined : styles.bodyFlex, { paddingBottom: bottom + spacing.lg }]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  iconBtn: { width: 40, alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  scroll: { flexGrow: 1 },
  body: { padding: spacing.md },
  bodyFlex: { flex: 1 },
});
