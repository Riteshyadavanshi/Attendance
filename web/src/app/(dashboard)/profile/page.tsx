'use client';

import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { faceApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [face, setFace] = useState<{ face_enrolled: boolean; enrolled_at: string | null } | null>(null);

  useEffect(() => {
    faceApi.status().then(setFace).catch(() => setFace(null));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <Card>
        <p className="text-sm text-slate-500">Name</p>
        <p className="font-semibold text-slate-900">{user?.full_name ?? '—'}</p>
        <p className="mt-4 text-sm text-slate-500">Email</p>
        <p className="font-semibold text-slate-900">{user?.email}</p>
        <p className="mt-4 text-sm text-slate-500">Roles</p>
        <p className="font-semibold capitalize text-slate-900">{user?.roles?.join(', ')}</p>
        <p className="mt-4 text-sm text-slate-500">Face enrolled</p>
        <p className="font-semibold text-slate-900">
          {face?.face_enrolled ? `Yes · ${face.enrolled_at ? formatDateTime(face.enrolled_at) : ''}` : 'No'}
        </p>
      </Card>
    </div>
  );
}
