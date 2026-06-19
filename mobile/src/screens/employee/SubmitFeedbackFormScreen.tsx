import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { feedbackFormsApi, type FeedbackFormRecord } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { radii, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'SubmitFeedbackForm'>;

export function SubmitFeedbackFormScreen({ route, navigation }: Props) {
  const { formId, title } = route.params;
  const { colors } = useTheme();
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    feedbackFormsApi
      .get(formId)
      .then(setForm)
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [formId]);

  const setAnswer = (qid: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      await feedbackFormsApi.submit(formId, answers);
      Alert.alert('Thank you', 'Your feedback was submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not submit');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
  ];

  if (loading) {
    return (
      <StackShell title={title ?? 'Feedback'}>
        <ActivityIndicator color={colors.primary} />
      </StackShell>
    );
  }

  if (!form) {
    return (
      <StackShell title="Feedback">
        <Text style={{ color: colors.textMuted }}>Form not found</Text>
      </StackShell>
    );
  }

  if (form.already_submitted) {
    return (
      <StackShell title={form.title}>
        <Card accent>
          <Text style={[styles.done, { color: colors.text }]}>You already submitted this form.</Text>
        </Card>
      </StackShell>
    );
  }

  return (
    <StackShell title={form.title}>
      {form.description ? (
        <Text style={[styles.desc, { color: colors.textMuted }]}>{form.description}</Text>
      ) : null}

      {form.questions.map((q, i) => (
        <Card key={q.id} style={styles.qCard}>
          <Text style={[styles.qLabel, { color: colors.text }]}>
            {i + 1}. {q.label}
            {q.required ? ' *' : ''}
          </Text>

          {q.type === 'rating' && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setAnswer(q.id, n)}
                  style={[
                    styles.ratingBtn,
                    {
                      backgroundColor: answers[q.id] === n ? colors.primary : colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: answers[q.id] === n ? '#FFF' : colors.primary,
                      fontWeight: '700',
                    }}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {q.type === 'text' && (
            <TextInput
              style={[inputStyle, styles.textArea]}
              value={String(answers[q.id] ?? '')}
              onChangeText={(v) => setAnswer(q.id, v)}
              placeholder="Your answer"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          )}
        </Card>
      ))}

      <Button label={saving ? 'Submitting...' : 'Submit Feedback'} onPress={onSubmit} disabled={saving} loading={saving} />
    </StackShell>
  );
}

const styles = StyleSheet.create({
  desc: { marginBottom: spacing.md, fontSize: 14, lineHeight: 20 },
  qCard: { marginBottom: spacing.sm },
  qLabel: { fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  done: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
