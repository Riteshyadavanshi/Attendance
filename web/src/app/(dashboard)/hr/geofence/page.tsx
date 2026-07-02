'use client';

import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { officeLocationApi } from '@/lib/api';

export default function GeofencePage() {
  const { getCurrentLocation } = useGeolocation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Main Office');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [radius, setRadius] = useState('300');

  useEffect(() => {
    let active = true;
    officeLocationApi
      .list()
      .then((items) => {
        if (!active) return;
        const loc = items[0];
        if (loc) {
          setName(loc.name);
          setLatitude(String(loc.latitude));
          setLongitude(String(loc.longitude));
          setRadius(String(loc.radius_meters));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const r = parseInt(radius, 10);
    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(r)) {
      toast.warning('Enter valid name, coordinates, and radius.');
      return;
    }
    setSaving(true);
    try {
      await officeLocationApi.save({ name: name.trim(), latitude: lat, longitude: lng, radius_meters: r });
      toast.success('Geofence saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Office geofence</h1>
          <p className="text-sm text-muted-foreground">
            One office boundary for check-in and check-out. Employees must be inside this radius.
          </p>
        </div>
        <Card>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
              <div>
                <Label>Radius (meters)</Label>
                <Input value={radius} onChange={(e) => setRadius(e.target.value)} />
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-primary"
                onClick={async () => {
                  try {
                    const pos = await getCurrentLocation();
                    setLatitude(String(pos.latitude));
                    setLongitude(String(pos.longitude));
                  } catch {
                    toast.warning('Could not read GPS.');
                  }
                }}
              >
                Use current GPS
              </button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save geofence'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </HrGuard>
  );
}
