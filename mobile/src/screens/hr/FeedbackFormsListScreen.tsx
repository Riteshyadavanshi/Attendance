import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { feedbackFormsApi, type FeedbackFormRecord } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { spacing } from '../../theme/colors';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function FeedbackFormsListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const data = await feedbackFormsApi.listHr(pageNum);
      setForms((prev) => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasMore(data.has_more);
    } catch {
      if (!append) setForms([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, false); }, [load]));

  const onLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    load(page + 1, true);
  };

  return (
    <StackShell title="Feedback Forms" scroll={false}>
      <Button
        label="Create Form"
        icon={<Ionicons name="add-circle-outline" size={20} color="#FFF" />}
        onPress={() => navigation.navigate('CreateFeedbackForm')}
        style={styles.createBtn}
      />

      {loading && forms.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.id}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>No forms yet</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate('FeedbackFormDashboard', { formId: item.id, title: item.title })}>
              <Card style={styles.card}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                {item.description ? (
                  <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.meta}>
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {item.response_count} responses
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {item.questions.length} questions
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  createBtn: { marginBottom: spacing.md },
  loader: { marginTop: 40 },
  footer: { marginVertical: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  card: { marginBottom: spacing.sm },
  title: { fontSize: 17, fontWeight: '700' },
  desc: { marginTop: 4, fontSize: 14 },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  metaText: { fontSize: 13, fontWeight: '600' },
});
