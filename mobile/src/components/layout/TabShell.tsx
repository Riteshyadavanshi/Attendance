import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppHeader } from './AppHeader';
import { useTheme } from '../../hooks/useTheme';
import { TAB_BAR_HEIGHT } from '../../navigation/tabConfig';
import { useSafeInsets } from '../../hooks/useSafeInsets';
import { spacing } from '../../theme/colors';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function TabShell({ children, title, subtitle, scroll = true, contentStyle }: Props) {
  const { colors } = useTheme();
  const { bottom } = useSafeInsets();
  const padBottom = TAB_BAR_HEIGHT + bottom + spacing.md;

  const body = (
    <View style={[styles.content, { paddingBottom: padBottom }, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={title} subtitle={subtitle} />
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollGrow}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollGrow: { flexGrow: 1 },
  content: { padding: spacing.md, flex: 1 },
});
