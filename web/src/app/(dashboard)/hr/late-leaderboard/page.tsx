'use client';

import { useEffect, useState } from 'react';

import { LateRankList } from '@/components/hr/LateLeaderboardList';
import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { attendanceApi, type LateLeaderboardEntry } from '@/lib/api';

export default function LateLeaderboardPage() {
  const [items, setItems] = useState<LateLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .lateLeaderboard()
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <HrGuard>
      <>
        <PageHeader
          title="Late leaderboard"
          description="All-time company ranking by late days"
        />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <LateRankList mode="overall" items={items} />
        )}
      </>
    </HrGuard>
  );
}
