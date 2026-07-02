'use client';

import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/input';
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
      <>
        <PageHeader
          title="Office geofence"
          description="One office boundary for check-in and check-out. Employees must be inside this radius."
        />
        <Card>
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={onSave} className="flex flex-col gap-4">
              <FormField label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Latitude">
                <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </FormField>
              <FormField label="Longitude">
                <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </FormField>
              <FormField label="Radius (meters)">
                <Input value={radius} onChange={(e) => setRadius(e.target.value)} />
              </FormField>
              <button
                type="button"
                className="self-start text-sm font-semibold text-primary"
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
              <Button type="submit" disabled={saving} className="self-start">
                {saving ? 'Saving…' : 'Save geofence'}
              </Button>
            </form>
          )}
        </Card>
      </>
    </HrGuard>
  );
}
