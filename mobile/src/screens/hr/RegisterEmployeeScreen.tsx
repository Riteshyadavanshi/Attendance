import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { employeesApi } from '../../services/api';
import { ROLES } from '../../constants/config';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { MainStackParamList } from '../../navigation/MainTabs';
import { radii, spacing } from '../../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'RegisterEmployee'>;

export function RegisterEmployeeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text },
  ];

  const onSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !password || !employeeCode.trim()) {
      Alert.alert('Validation', 'Fill in name, email, password, and employee code.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Validation', 'Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await employeesApi.create({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        employee_code: employeeCode.trim().toUpperCase(),
        designation: designation.trim() || undefined,
        mobile: mobile.trim() || undefined,
        roles: [ROLES.EMPLOYEE],
      });
      Alert.alert('Success', 'Employee registered successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not register employee');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackShell title="Register Employee">
      <Card>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Create a new employee account. They can sign in with the email and password you set.
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Full name</Text>
        <TextInput
          style={inputStyle}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jane Doe"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Employee code</Text>
        <TextInput
          style={inputStyle}
          value={employeeCode}
          onChangeText={setEmployeeCode}
          placeholder="EMP002"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <TextInput
          style={inputStyle}
          value={email}
          onChangeText={setEmail}
          placeholder="employee@company.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
        <TextInput
          style={inputStyle}
          value={password}
          onChangeText={setPassword}
          placeholder="Min. 8 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Designation (optional)</Text>
        <TextInput
          style={inputStyle}
          value={designation}
          onChangeText={setDesignation}
          placeholder="Software Engineer"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile (optional)</Text>
        <TextInput
          style={inputStyle}
          value={mobile}
          onChangeText={setMobile}
          placeholder="+91..."
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />

        <Button
          label={saving ? 'Saving...' : 'Register Employee'}
          onPress={onSubmit}
          disabled={saving}
          loading={saving}
          icon={!saving ? <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" /> : undefined}
        />
      </Card>
    </StackShell>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
});
