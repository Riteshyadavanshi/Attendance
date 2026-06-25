'use client';

import { Lock } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { Input, Label, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { employeesApi, type EmployeeProfile } from '@/lib/api';

export type IdentityFormHandle = {
  /** Persists edited gender/dob/location if they changed. */
  save: () => Promise<void>;
  loaded: boolean;
};

function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

type Props = { title?: string; description?: string };

export const IdentityForm = forwardRef<IdentityFormHandle, Props>(function IdentityForm(
  { title = 'Your details', description },
  ref,
) {
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
      loaded: !!profile,
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
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">Could not load your profile details.</p>;
  }

  const age = ageFromDob(dob);

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Employee name</Label>
          <Input value={profile.full_name} readOnly className="bg-muted/40" />
        </div>
        <div>
          <Label className="flex items-center gap-1">
            Employee ID <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Input value={profile.employee_code} readOnly disabled className="bg-muted/40" />
        </div>
        <div>
          <Label>Department</Label>
          <Input value={profile.department_name ?? '—'} readOnly className="bg-muted/40" />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City / office"
          />
        </div>
        <div>
          <Label>Gender</Label>
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </Select>
        </div>
        <div>
          <Label>Date of birth{age !== null ? ` · Age ${age}` : ''}</Label>
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
      </div>
    </div>
  );
});
