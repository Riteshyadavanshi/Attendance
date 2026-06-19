import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { feedbackFormsApi, type FeedbackQuestion } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { radii, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateFeedbackForm'>;

function newQuestion(type: FeedbackQuestion['type']): FeedbackQuestion {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return { id, type, label: '', required: true, options: type === 'choice' ? ['Option 1', 'Option 2'] : undefined };
}

export function CreateFeedbackFormScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([
    { id: 'q1', type: 'rating', label: 'Overall satisfaction', required: true },
    { id: 'q2', type: 'text', label: 'Your suggestions', required: false },
  ]);
  const [saving, setSaving] = useState(false);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
  ];

  const updateQuestion = (id: string, patch: Partial<FeedbackQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Enter a form title.');
      return;
    }
    if (questions.some((q) => !q.label.trim())) {
      Alert.alert('Validation', 'Every question needs a label.');
      return;
    }
    setSaving(true);
    try {
      await feedbackFormsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        questions,
      });
      Alert.alert('Created', 'Feedback form published.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not create form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackShell title="Create Feedback Form">
      <Card>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
        <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="Form title" placeholderTextColor={colors.textMuted} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this form about?"
          placeholderTextColor={colors.textMuted}
          multiline
        />

        <Text style={[styles.section, { color: colors.text }]}>Questions</Text>
        {questions.map((q, index) => (
          <View key={q.id} style={[styles.questionBox, { borderColor: colors.cardBorder }]}>
            <View style={styles.questionHead}>
              <Text style={[styles.qIndex, { color: colors.primary }]}>Q{index + 1}</Text>
              <Text style={[styles.qType, { color: colors.textMuted }]}>{q.type}</Text>
              {questions.length > 1 && (
                <Pressable onPress={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </Pressable>
              )}
            </View>
            <TextInput
              style={inputStyle}
              value={q.label}
              onChangeText={(v) => updateQuestion(q.id, { label: v })}
              placeholder="Question label"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={() => updateQuestion(q.id, { required: !q.required })} style={styles.requiredRow}>
              <Ionicons
                name={q.required ? 'checkbox' : 'square-outline'}
                size={20}
                color={q.required ? colors.primary : colors.textMuted}
              />
              <Text style={{ color: colors.textSecondary }}>Required</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.addRow}>
          <Button label="+ Rating" variant="outline" fullWidth={false} onPress={() => setQuestions((p) => [...p, newQuestion('rating')])} style={styles.addBtn} />
          <Button label="+ Text" variant="outline" fullWidth={false} onPress={() => setQuestions((p) => [...p, newQuestion('text')])} style={styles.addBtn} />
        </View>

        <Button label={saving ? 'Publishing...' : 'Publish Form'} onPress={onSubmit} disabled={saving} loading={saving} />
      </Card>
    </StackShell>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15 },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  section: { fontSize: 16, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  questionBox: { borderWidth: 1, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm },
  questionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  qIndex: { fontWeight: '800' },
  qType: { flex: 1, textTransform: 'capitalize', fontSize: 12 },
  requiredRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addBtn: { flex: 1, paddingVertical: 10 },
});
