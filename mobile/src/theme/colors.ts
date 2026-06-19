export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  headerBg: string;
  headerText: string;
  tabBar: string;
  tabBarBorder: string;
  tabInactive: string;
  tabActive: string;
  inputBg: string;
  inputBorder: string;
  chipBg: string;
  chipActive: string;
  chipText: string;
  shadow: string;
};

export const lightColors: ThemeColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  primary: '#0D9488',
  primarySoft: '#CCFBF1',
  accent: '#0284C7',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  headerBg: '#0F766E',
  headerText: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabInactive: '#94A3B8',
  tabActive: '#0D9488',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  chipBg: '#E2E8F0',
  chipActive: '#0D9488',
  chipText: '#475569',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const darkColors: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  cardBorder: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  primary: '#2DD4BF',
  primarySoft: '#134E4A',
  accent: '#38BDF8',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  headerBg: '#134E4A',
  headerText: '#F0FDFA',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  tabInactive: '#64748B',
  tabActive: '#2DD4BF',
  inputBg: '#1E293B',
  inputBorder: '#475569',
  chipBg: '#334155',
  chipActive: '#0D9488',
  chipText: '#CBD5E1',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 } as const;
