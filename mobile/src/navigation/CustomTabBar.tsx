import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { visibleBottomTabs } from './tabConfig';
import { spacing } from '../theme/colors';

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const hasRole = useAuthStore((s) => s.hasRole);
  const bottomTabs = visibleBottomTabs(hasRole);
  const routes = state?.routes ?? [];

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      <View style={styles.row}>
        {routes
          .filter((r) => bottomTabs.some((t) => t.name === r.name))
          .map((route) => {
            const tab = bottomTabs.find((t) => t.name === route.name);
            if (!tab) return null;

            const index = routes.findIndex((r) => r.key === route.key);
            const focused = state.index === index;

            return (
              <Pressable
                key={route.key}
                style={styles.tab}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              >
                <Ionicons
                  name={(focused ? tab.iconFocused : tab.icon) as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={focused ? colors.tabActive : colors.tabInactive}
                />
                <Text
                  style={[
                    styles.label,
                    { color: focused ? colors.tabActive : colors.tabInactive },
                  ]}
                >
                  {tab.label}
                </Text>
                {focused && <View style={[styles.dot, { backgroundColor: colors.tabActive }]} />}
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  row: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
  label: { fontSize: 11, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
