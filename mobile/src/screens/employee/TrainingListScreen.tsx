import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { feedbackFormsApi, type FeedbackFormRecord } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { TabShell } from '../../components/layout/TabShell';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { spacing } from '../../theme/colors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function TrainingListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackFormsApi.listActive();
      setForms(Array.isArray(data) ? data : []);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <TabShell title="Training & Feedback" scroll={false} contentStyle={styles.shell}>
      <Text style={[styles.section, { color: colors.textMuted }]}>Open feedback forms</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Card>
              <View style={styles.row}>
                <Ionicons name="school-outline" size={28} color={colors.accent} />
                <View style={styles.text}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>No forms available</Text>
                  <Text style={[styles.sub, { color: colors.textMuted }]}>
                    HR-published feedback forms will appear here.
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <Pressable
              disabled={item.already_submitted}
              onPress={() =>
                navigation.navigate('SubmitFeedbackForm', { formId: item.id, title: item.title })
              }
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons
                      name={item.already_submitted ? 'checkmark-circle' : 'chatbox-ellipses-outline'}
                      size={26}
                      color={item.already_submitted ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={styles.text}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={2}>
                      {item.already_submitted
                        ? 'Submitted — thank you'
                        : item.description ?? `${item.questions.length} questions`}
                    </Text>
                  </View>
                  {!item.already_submitted && (
                    <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
                  )}
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </TabShell>
  );
}

const styles = StyleSheet.create({
  shell: { paddingTop: 0, flex: 1 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  loader: { marginTop: 40 },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  sub: { marginTop: 4, fontSize: 13, lineHeight: 18 },
});
