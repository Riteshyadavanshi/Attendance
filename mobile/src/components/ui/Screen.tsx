import React, { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { spacing } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import { useSafeInsets } from '../../hooks/useSafeInsets';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  animate?: boolean;
  delay?: number;
  /** Extra space below status bar (default spacing.sm). */
  topGap?: number;
};

export function Screen({
  children,
  style,
  padded = true,
  animate = true,
  delay = 0,
  topGap = spacing.sm,
}: Props) {
  const { colors } = useTheme();
  const { top, bottom } = useSafeInsets();

  const content = (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: top + topGap,
          paddingBottom: bottom > 0 ? 0 : spacing.sm,
        },
        padded && { paddingHorizontal: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!animate) return content;

  return (
    <Animated.View entering={FadeInDown.duration(420).delay(delay)} style={styles.flex}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
});
