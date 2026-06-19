import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { attendanceRulesApi, type AttendanceRules } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { radii, spacing } from '../../theme/colors';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function Field({
  label,
  hint,
  value,
  onChangeText,
  keyboardType = 'default',
  colors,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text> : null}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

export function AttendanceRulesScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [lateGrace, setLateGrace] = useState('15');
  const [standardHours, setStandardHours] = useState('8');
  const [lateAfter, setLateAfter] = useState('09:15');
  const [checkInOpens, setCheckInOpens] = useState('08:00');

  const applyRules = (rules: AttendanceRules) => {
    setTimezone(rules.timezone ?? 'Asia/Kolkata');
    setWorkStart(rules.work_start_time);
    setWorkEnd(rules.work_end_time);
    setLateGrace(String(rules.late_threshold_minutes));
    setStandardHours(String(rules.standard_hours));
    setLateAfter(rules.late_after_time ?? rules.work_start_time);
    setCheckInOpens(rules.check_in_opens_at ?? '08:00');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await attendanceRulesApi.get();
      applyRules(data);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load work hours');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onSave = async () => {
    if (!TIME_PATTERN.test(workStart) || !TIME_PATTERN.test(workEnd)) {
      Alert.alert('Validation', 'Use 24-hour time format HH:MM (e.g. 09:00, 18:30).');
      return;
    }
    const grace = parseInt(lateGrace, 10);
    const standard = parseFloat(standardHours);
    if (Number.isNaN(grace) || grace < 0 || grace > 180) {
      Alert.alert('Validation', 'Late grace must be 0–180 minutes.');
      return;
    }
    if (Number.isNaN(standard) || standard <= 0 || standard > 24) {
      Alert.alert('Validation', 'Standard hours must be between 0 and 24.');
      return;
    }
    if (workStart >= workEnd) {
      Alert.alert('Validation', 'Check-in time must be before check-out time.');
      return;
    }

    setSaving(true);
    try {
      const updated = await attendanceRulesApi.update({
        work_start_time: workStart,
        work_end_time: workEnd,
        late_threshold_minutes: grace,
        standard_hours: standard,
        half_day_threshold_hours: 4,
        working_days: [1, 2, 3, 4, 5],
      });
      applyRules(updated);
      Alert.alert('Saved', 'Work hours updated for all employees.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StackShell title="Work Hours">
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </StackShell>
    );
  }

  return (
    <StackShell title="Work Hours">
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Set when employees should check in and out. Times use your organization timezone (
        {timezone}).
      </Text>

      <Card>
        <Field
          label="Check-in time (work start)"
          hint="Official start of the work day"
          value={workStart}
          onChangeText={setWorkStart}
          colors={colors}
        />
        <Field
          label="Late grace (minutes)"
          hint={`Marked late after ${lateAfter} if grace is unchanged`}
          value={lateGrace}
          onChangeText={setLateGrace}
          keyboardType="numeric"
          colors={colors}
        />
        <Field
          label="Check-out time (work end)"
          hint="Expected end of the work day"
          value={workEnd}
          onChangeText={setWorkEnd}
          colors={colors}
        />
        <Field
          label="Standard work hours"
          hint="Used for overtime calculation"
          value={standardHours}
          onChangeText={setStandardHours}
          keyboardType="numeric"
          colors={colors}
        />
      </Card>

      <View style={[styles.summary, { backgroundColor: colors.primarySoft, borderColor: colors.cardBorder }]}>
        <Text style={[styles.summaryTitle, { color: colors.primary }]}>Check-in rules</Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Check-in opens at {checkInOpens} (1 hour before {workStart})
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          On-time: by {lateAfter} · Late: after {lateAfter}
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Check-in closes at {workEnd} ({timezone})
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Half-day: if worked less than 4 hours after a valid check-in
        </Text>
      </View>

      {saving ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <Button label="Save Work Hours" onPress={onSave} style={{ marginTop: spacing.lg }} />
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  summary: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 4,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  summaryText: { fontSize: 13, lineHeight: 18 },
});
