'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { faceApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-right font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [face, setFace] = useState<{ face_enrolled: boolean; enrolled_at: string | null } | null>(null);

  useEffect(() => {
    faceApi.status().then(setFace).catch(() => setFace(null));
  }, []);

  const initials = (user?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <PageHeader title="Profile" description="Your account and enrollment status." />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{user?.full_name ?? '—'}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div>
          <Row label="Roles" value={<span className="capitalize">{user?.roles?.join(', ')}</span>} />
          <Row
            label="Face enrolled"
            value={
              face?.face_enrolled ? (
                <Badge tone="success">
                  Yes{face.enrolled_at ? ` · ${formatDateTime(face.enrolled_at)}` : ''}
                </Badge>
              ) : (
                <Badge tone="muted">No</Badge>
              )
            }
          />
        </div>
      </Card>
    </>
  );
}
