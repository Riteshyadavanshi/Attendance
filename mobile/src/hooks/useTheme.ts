import { useMemo } from 'react';

import { darkColors, lightColors, type ThemeColors } from '../theme/colors';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const setMode = useThemeStore((s) => s.setMode);

  const colors = useMemo<ThemeColors>(
    () => (mode === 'dark' ? darkColors : lightColors),
    [mode],
  );

  return {
    mode,
    colors,
    isDark: mode === 'dark',
    toggle,
    setMode,
  };
}
