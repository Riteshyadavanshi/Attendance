import type { Theme } from '@react-navigation/native';

import { darkColors, lightColors } from '../theme/colors';

export function buildNavigationTheme(isDark: boolean): Theme {
  const c = isDark ? darkColors : lightColors;
  return {
    dark: isDark,
    colors: {
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.text,
      border: c.cardBorder,
      notification: c.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
}
