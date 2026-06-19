import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { feedbackFormsApi, type FeedbackFormDashboard } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'FeedbackFormDashboard'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;

export function FeedbackFormDashboardScreen({ route }: Props) {
  const { formId, title } = route.params;
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [data, setData] = useState<FeedbackFormDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await feedbackFormsApi.dashboard(formId);
      setData(dashboard);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <StackShell title={title ?? 'Form Dashboard'}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !data ? (
        <Text style={{ color: colors.textMuted }}>Could not load dashboard</Text>
      ) : (
        <>
          <View style={styles.stats}>
            <StatCard label="Total Responses" value={data.total_responses} color={colors.primary} style={styles.stat} />
            <StatCard label="Questions" value={data.questions.length} color={colors.accent} style={styles.stat} />
          </View>

          <Button
            label="View All Responses"
            onPress={() =>
              navigation.navigate('FeedbackFormResponses', { formId, title: data.title })
            }
            style={styles.btn}
          />

          <Text style={[styles.section, { color: colors.textMuted }]}>Question insights</Text>
          {data.questions.map((q) => (
            <Card key={q.id} style={styles.qCard}>
              <Text style={[styles.qLabel, { color: colors.text }]}>{q.label}</Text>
              <Text style={[styles.qMeta, { color: colors.textMuted }]}>
                {q.type} · {q.response_count} answers
              </Text>
              {q.type === 'rating' && q.average != null && (
                <Text style={[styles.qHighlight, { color: colors.primary }]}>
                  Average: {q.average} / 5
                </Text>
              )}
              {q.distribution && (
                <View style={styles.dist}>
                  {Object.entries(q.distribution).map(([star, count]) => (
                    <Text key={star} style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {star}★: {count}
                    </Text>
                  ))}
                </View>
              )}
              {q.recent_texts && q.recent_texts.length > 0 && (
                <View style={styles.textSamples}>
                  {q.recent_texts.map((t, i) => (
                    <Text key={i} style={[styles.sample, { color: colors.textSecondary }]}>
                      “{t}”
                    </Text>
                  ))}
                </View>
              )}
            </Card>
          ))}
        </>
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  stat: { flex: 1, marginBottom: 0 },
  btn: { marginBottom: spacing.lg },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  qCard: { marginBottom: spacing.sm },
  qLabel: { fontSize: 16, fontWeight: '700' },
  qMeta: { marginTop: 4, fontSize: 13 },
  qHighlight: { marginTop: spacing.sm, fontSize: 18, fontWeight: '800' },
  dist: { marginTop: spacing.sm, gap: 2 },
  textSamples: { marginTop: spacing.sm, gap: 4 },
  sample: { fontSize: 13, fontStyle: 'italic' },
});
