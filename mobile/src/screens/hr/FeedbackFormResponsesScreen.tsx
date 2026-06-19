import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { feedbackFormsApi, type FeedbackFormRecord, type FeedbackSubmission } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'FeedbackFormResponses'>;

export function FeedbackFormResponsesScreen({ route }: Props) {
  const { formId, title } = route.params;
  const { colors } = useTheme();
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [responses, setResponses] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      if (pageNum === 1) {
        const formData = await feedbackFormsApi.get(formId);
        setForm(formData);
      }
      const data = await feedbackFormsApi.responses(formId, pageNum);
      setResponses((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasMore(data.has_more);
    } catch {
      if (!append) setResponses([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [formId]);

  useFocusEffect(useCallback(() => { load(1, false); }, [load]));

  const questionLabel = (qid: string) =>
    form?.questions.find((q) => q.id === qid)?.label ?? qid;

  return (
    <StackShell title={title ?? 'Responses'} scroll={false}>
      {loading && responses.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={responses}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) load(page + 1, true);
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>No responses yet</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.employee_name ?? 'Unknown'}
              </Text>
              <Text style={[styles.code, { color: colors.textMuted }]}>
                {item.employee_code} · {item.submitted_at?.slice(0, 10) ?? ''}
              </Text>
              {Object.entries(item.answers).map(([qid, ans]) => (
                <View key={qid} style={styles.answer}>
                  <Text style={[styles.q, { color: colors.textMuted }]}>{questionLabel(qid)}</Text>
                  <Text style={[styles.a, { color: colors.text }]}>{String(ans)}</Text>
                </View>
              ))}
            </Card>
          )}
        />
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: spacing.xl },
  footer: { marginVertical: spacing.md },
  card: { marginBottom: spacing.sm },
  name: { fontSize: 16, fontWeight: '700' },
  code: { fontSize: 12, marginTop: 2, marginBottom: spacing.sm },
  answer: { marginTop: spacing.sm },
  q: { fontSize: 12, fontWeight: '600' },
  a: { fontSize: 14, marginTop: 2 },
});
