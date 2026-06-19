import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import { useTheme } from '../../hooks/useTheme';
import { useSafeInsets } from '../../hooks/useSafeInsets';
import { HR_SIDEBAR_ITEMS } from '../../navigation/tabConfig';
import { navigateToMainStack, navigateToTab } from '../../navigation/navigationRef';
import { radii, spacing } from '../../theme/colors';

const SIDEBAR_WIDTH = 288;

export function AppSidebar() {
  const { colors, isDark, toggle } = useTheme();
  const { top, bottom } = useSafeInsets();
  const { width } = useWindowDimensions();
  const open = useSidebarStore((s) => s.open);
  const closeSidebar = useSidebarStore((s) => s.closeSidebar);
  const isHr = useAuthStore((s) => s.isHr);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const activeRoute = useSidebarStore((s) => s.activeRoute);

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(open ? 0 : -SIDEBAR_WIDTH, { duration: 220 });
    overlayOpacity.value = withTiming(open ? 1 : 0, { duration: 220 });
  }, [open, overlayOpacity, translateX]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!isHr()) return null;

  const goToTab = (name: string) => {
    closeSidebar();
    navigateToTab(name);
  };

  const goToStack = (
    screen: 'GeofenceConfig' | 'RegisterEmployee' | 'EmployeeList' | 'FeedbackFormsList',
  ) => {
    closeSidebar();
    navigateToMainStack(screen);
  };

  const onItemPress = (item: (typeof HR_SIDEBAR_ITEMS)[number]) => {
    if (item.tab) goToTab(item.tab);
    else if (item.stackScreen) goToStack(item.stackScreen);
  };

  const isActive = (item: (typeof HR_SIDEBAR_ITEMS)[number]) => {
    if (item.tab) return activeRoute === item.tab;
    if (item.stackScreen) return activeRoute === item.stackScreen;
    return false;
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={closeSidebar}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            panelStyle,
            {
              width: Math.min(SIDEBAR_WIDTH, width * 0.85),
              backgroundColor: colors.surface,
              paddingTop: top + spacing.md,
              paddingBottom: bottom + spacing.md,
            },
          ]}
        >
          <View style={[styles.profile, { borderBottomColor: colors.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {user?.full_name || 'User'}
              </Text>
              <Text style={[styles.badge, { color: colors.primary }]}>HR Admin</Text>
            </View>
            <Pressable onPress={closeSidebar} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.menu}>
            <Text style={[styles.section, { color: colors.textMuted }]}>HR Management</Text>
            {HR_SIDEBAR_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => onItemPress(item)}
                style={[
                  styles.item,
                  { backgroundColor: isActive(item) ? colors.primarySoft : 'transparent' },
                ]}
              >
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={isActive(item) ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.itemLabel,
                    { color: isActive(item) ? colors.primary : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
            <Pressable onPress={toggle} style={styles.themeRow}>
              <View style={styles.themeLeft}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.textSecondary} />
                <Text style={[styles.themeLabel, { color: colors.text }]}>Dark mode</Text>
              </View>
              <Ionicons
                name={isDark ? 'toggle' : 'toggle-outline'}
                size={28}
                color={isDark ? colors.primary : colors.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                closeSidebar();
                logout();
              }}
              style={[styles.logout, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Sign out</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  profileText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  menu: { flex: 1, paddingHorizontal: spacing.sm },
  section: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    marginBottom: 2,
  },
  itemLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  footer: { borderTopWidth: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  themeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
