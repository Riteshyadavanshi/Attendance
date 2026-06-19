import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { radii } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = { compact?: boolean };

export function ThemeToggle({ compact }: Props) {
  const { colors, isDark, toggle } = useTheme();
  const progress = useSharedValue(isDark ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, { damping: 18 });
  }, [isDark, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (compact ? 20 : 24) }],
  }));

  return (
    <Pressable onPress={toggle} accessibilityRole="switch">
      <AnimatedView style={[styles.track, compact && styles.trackCompact, trackStyle]}>
        <AnimatedView style={[styles.thumb, thumbStyle]}>
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={14} color={colors.headerText} />
        </AnimatedView>
      </AnimatedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 28, borderRadius: radii.full, padding: 3, justifyContent: 'center' },
  trackCompact: { width: 46, height: 26 },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
