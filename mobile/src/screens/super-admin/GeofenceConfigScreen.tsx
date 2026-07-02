import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useLocation } from '../../hooks/useLocation';
import { officeLocationApi } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { radii, spacing } from '../../theme/colors';

export function GeofenceConfigScreen() {
  const { colors } = useTheme();
  const { getCurrentLocation } = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Main Office');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [radius, setRadius] = useState('300');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await officeLocationApi.list();
      const loc = data[0];
      if (loc) {
        setName(loc.name);
        setLatitude(String(loc.latitude));
        setLongitude(String(loc.longitude));
        setRadius(String(loc.radius_meters));
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inputStyle = [styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }];

  const onSave = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const r = parseInt(radius, 10);
    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(r)) {
      Alert.alert('Validation', 'Enter valid name, coordinates, and radius.');
      return;
    }
    setSaving(true);
    try {
      await officeLocationApi.save({ name: name.trim(), latitude: lat, longitude: lng, radius_meters: r });
      Alert.alert('Saved', 'Office geofence updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackShell title="Office Geofence">
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        One office boundary for all check-ins. Employees must be inside this radius.
      </Text>
      <Card>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Location name" placeholderTextColor={colors.textMuted} />
            <TextInput style={inputStyle} value={latitude} onChangeText={setLatitude} placeholder="Latitude" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={inputStyle} value={longitude} onChangeText={setLongitude} placeholder="Longitude" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <TextInput style={inputStyle} value={radius} onChangeText={setRadius} placeholder="Radius (m)" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            <Pressable onPress={async () => {
              try {
                const pos = await getCurrentLocation(false);
                setLatitude(String(pos.latitude));
                setLongitude(String(pos.longitude));
              } catch { Alert.alert('GPS', 'Could not read location.'); }
            }}>
              <Text style={[styles.link, { color: colors.primary }]}>Use current GPS</Text>
            </Pressable>
            <Button label={saving ? 'Saving...' : 'Save geofence'} onPress={onSave} disabled={saving} />
          </>
        )}
      </Card>
    </StackShell>
  );
}

const styles = StyleSheet.create({
  sub: { marginBottom: spacing.md, fontSize: 14 },
  input: { borderWidth: 1, borderRadius: radii.sm, padding: 12, marginBottom: spacing.sm, fontSize: 15 },
  link: { fontWeight: '600', marginBottom: spacing.md },
});
