'use client';

import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { useGeolocation } from '@/hooks/useGeolocation';
import { officeLocationApi, type OfficeLocation } from '@/lib/api';

export default function GeofencePage() {
  const { getCurrentLocation } = useGeolocation();
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Main Office');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [radius, setRadius] = useState('300');
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setLocations(await officeLocationApi.list());
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const r = parseInt(radius, 10);
    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(r)) {
      setMessage('Enter valid name, coordinates, and radius.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await officeLocationApi.create({ name: name.trim(), latitude: lat, longitude: lng, radius_meters: r });
      await load();
      setMessage('Geofence saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Geofence settings</h1>
        <Card>
          <form onSubmit={onCreate} className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Latitude</Label><Input value={latitude} onChange={(e) => setLatitude(e.target.value)} /></div>
            <div><Label>Longitude</Label><Input value={longitude} onChange={(e) => setLongitude(e.target.value)} /></div>
            <div><Label>Radius (m)</Label><Input value={radius} onChange={(e) => setRadius(e.target.value)} /></div>
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={async () => {
                try {
                  const pos = await getCurrentLocation();
                  setLatitude(String(pos.latitude));
                  setLongitude(String(pos.longitude));
                } catch {
                  setMessage('Could not read GPS.');
                }
              }}
            >
              Use current GPS
            </button>
            {message && <p className="text-sm font-medium text-primary">{message}</p>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add location'}</Button>
          </form>
        </Card>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading locations…</p>
        ) : locations.length === 0 ? (
          <Card><p className="text-sm text-muted-foreground">No locations yet.</p></Card>
        ) : (
          <div className="space-y-2">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <p className="font-semibold text-foreground">{loc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {loc.radius_meters}m
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HrGuard>
  );
}
