import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { feedbackFormsApi, type FeedbackFormRecord } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { navigateToMainStack } from '../../navigation/navigationRef';
import { radii, spacing } from '../../theme/colors';

export function FeedbackFormPopup() {
  const { colors } = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHr = useAuthStore((s) => s.isHr);
  const [queue, setQueue] = useState<FeedbackFormRecord[]>([]);
  const [visible, setVisible] = useState(false);

  const current = queue[0] ?? null;

  const loadPending = useCallback(async () => {
    if (!accessToken || isHr()) return;
    try {
      const items = await feedbackFormsApi.popupPending();
      const list = Array.isArray(items) ? items : [];
      setQueue(list);
      setVisible(list.length > 0);
    } catch {
      setQueue([]);
      setVisible(false);
    }
  }, [accessToken, isHr]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadPending();
    });
    return () => sub.remove();
  }, [loadPending]);

  const onDismiss = async () => {
    if (!current) return;
    try {
      await feedbackFormsApi.dismissPopup(current.id);
    } catch {
      // still advance queue locally
    }
    setQueue((prev) => {
      const next = prev.slice(1);
      setVisible(next.length > 0);
      return next;
    });
  };

  const onFill = () => {
    if (!current) return;
    const { id, title } = current;
    setVisible(false);
    setQueue((prev) => prev.slice(1));
    navigateToMainStack('SubmitFeedbackForm', { formId: id, title });
    setTimeout(() => loadPending(), 800);
  };

  if (!accessToken || isHr() || !current) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="notifications" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.badge, { color: colors.primary }]}>New feedback form</Text>
          <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
          {current.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]}>{current.description}</Text>
          ) : (
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              HR published a new form with {current.questions?.length ?? 0} question(s). Please share your feedback.
            </Text>
          )}

          <Pressable
            style={[styles.fillBtn, { backgroundColor: colors.primary }]}
            onPress={onFill}
          >
            <Text style={styles.fillText}>Fill Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>

          <Pressable onPress={onDismiss} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Later</Text>
          </Pressable>

          {queue.length > 1 && (
            <Text style={[styles.more, { color: colors.textMuted }]}>
              +{queue.length - 1} more form(s) waiting
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: spacing.sm },
  desc: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  fillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  fillText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: spacing.md, padding: spacing.sm },
  cancelText: { fontSize: 15, fontWeight: '600' },
  more: { marginTop: spacing.sm, fontSize: 12 },
});
