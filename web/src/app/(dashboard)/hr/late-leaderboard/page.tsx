'use client';

import { useEffect, useState } from 'react';

import { LateRankList } from '@/components/hr/LateLeaderboardList';
import { HrGuard } from '@/components/layout/HrGuard';
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Late leaderboard</h1>
        <p className="text-sm text-slate-500">All-time company ranking by late days</p>
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : <LateRankList mode="overall" items={items} />}
      </div>
    </HrGuard>
  );
}
