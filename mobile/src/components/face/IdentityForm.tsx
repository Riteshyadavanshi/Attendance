import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { employeesApi, type EmployeeProfile } from '../../services/api';
import { radii, spacing } from '../../theme/colors';

export type IdentityFormHandle = {
  save: () => Promise<void>;
};

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'N/A' },
];

function ageFromDob(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export const IdentityForm = forwardRef<IdentityFormHandle, { title?: string }>(function IdentityForm(
  { title = 'Your details' },
  ref,
) {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let active = true;
    employeesApi
      .me()
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setGender(p.gender ?? '');
        setDob(p.date_of_birth ?? '');
        setLocation(p.location ?? '');
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!profile) return;
        const changed =
          gender !== (profile.gender ?? '') ||
          dob !== (profile.date_of_birth ?? '') ||
          location !== (profile.location ?? '');
        if (!changed) return;
        await employeesApi.updateMe({
          gender: gender || null,
          date_of_birth: dob || null,
          location: location || null,
        });
      },
    }),
    [profile, gender, dob, location],
  );

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />;
  }
  if (!profile) {
    return <Text style={{ color: colors.textMuted }}>Could not load your profile.</Text>;
  }

  const age = ageFromDob(dob);
  const labelStyle = [styles.label, { color: colors.textMuted }];
  const readOnlyStyle = [
    styles.input,
    { backgroundColor: colors.chipBg, borderColor: colors.inputBorder, color: colors.textSecondary },
  ];
  const editStyle = [
    styles.input,
    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
  ];

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View>
        <Text style={labelStyle}>Employee name</Text>
        <Text style={readOnlyStyle}>{profile.full_name}</Text>
      </View>

      <View>
        <View style={styles.lockRow}>
          <Text style={labelStyle}>Employee ID</Text>
          <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
        </View>
        <Text style={readOnlyStyle}>{profile.employee_code}</Text>
      </View>

      <View>
        <Text style={labelStyle}>Department</Text>
        <Text style={readOnlyStyle}>{profile.department_name ?? '—'}</Text>
      </View>

      <View>
        <Text style={labelStyle}>Gender</Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => {
            const active = gender === g.value;
            return (
              <TouchableOpacity
                key={g.value}
                onPress={() => setGender(active ? '' : g.value)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.primary : colors.chipBg },
                ]}
              >
                <Text style={{ color: active ? '#fff' : colors.chipText, fontWeight: '600', fontSize: 13 }}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={labelStyle}>Date of birth (YYYY-MM-DD){age !== null ? ` · Age ${age}` : ''}</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="1995-08-21"
          placeholderTextColor={colors.textMuted}
          style={editStyle}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />
      </View>

      <View>
        <Text style={labelStyle}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="City / office"
          placeholderTextColor={colors.textMuted}
          style={editStyle}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full },
});
