import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useLocation } from '../../hooks/useLocation';
import { officeLocationApi, type OfficeLocation } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import { StackShell } from '../../components/layout/StackShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { radii, spacing } from '../../theme/colors';

export function GeofenceConfigScreen() {
  const { colors } = useTheme();
  const { getCurrentLocation } = useLocation();
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
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
      setLocations(data);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inputStyle = [styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }];

  const onCreate = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const r = parseInt(radius, 10);
    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(r)) {
      Alert.alert('Validation', 'Enter valid name, coordinates, and radius.');
      return;
    }
    setSaving(true);
    try {
      await officeLocationApi.create({ name: name.trim(), latitude: lat, longitude: lng, radius_meters: r });
      await load();
      Alert.alert('Created', 'Office geofence saved.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackShell title="Geofencing" scroll={false}>
      <Card>
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
        <Button label={saving ? 'Saving...' : 'Add Location'} onPress={onCreate} disabled={saving} />
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          style={{ marginTop: spacing.md }}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No locations yet</Text>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.locName, { color: colors.text }]}>{item.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)} · {item.radius_meters}m
              </Text>
            </Card>
          )}
        />
      )}
    </StackShell>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: radii.sm, padding: 12, marginBottom: spacing.sm, fontSize: 15 },
  link: { fontWeight: '600', marginBottom: spacing.md },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  locName: { fontWeight: '700', fontSize: 16 },
});
