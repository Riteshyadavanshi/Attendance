'use client';

import { useEffect, useState } from 'react';

import { LateRankList } from '@/components/hr/LateLeaderboardList';
import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { attendanceApi, type LateTodayEntry } from '@/lib/api';

export default function LateTodayPage() {
  const [items, setItems] = useState<LateTodayEntry[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .lateToday()
      .then((d) => {
        setItems(d.items ?? []);
        setDate(d.date);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HrGuard>
      <>
        <PageHeader title="Late today" description={date || undefined} />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <LateRankList mode="today" items={items} />
        )}
      </>
    </HrGuard>
  );
}
