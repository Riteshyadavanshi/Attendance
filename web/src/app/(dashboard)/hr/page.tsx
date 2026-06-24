'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LateRankList } from '@/components/hr/LateLeaderboardList';
import { HrGuard } from '@/components/layout/HrGuard';
import { Card, StatCard } from '@/components/ui/card';
import { attendanceApi, type LateTodayEntry } from '@/lib/api';

export default function HRDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [lateToday, setLateToday] = useState<LateTodayEntry[]>([]);

  useEffect(() => {
    attendanceApi.dashboard().then(setStats).catch(() => setStats({}));
    attendanceApi.lateToday().then((d) => setLateToday((d.items ?? []).slice(0, 5))).catch(() => setLateToday([]));
  }, []);

  return (
    <HrGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-sm text-slate-500">Today&apos;s overview</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total employees" value={String(stats.total_employees ?? '—')} />
          <StatCard label="Present today" value={String(stats.present ?? '—')} color="text-green-600" />
          <StatCard label="Absent today" value={String(stats.absent ?? '—')} color="text-red-600" />
          <Link href="/hr/late-today">
            <StatCard label="Late today" value={String(stats.late ?? '—')} color="text-amber-600" />
          </Link>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Late today</p>
            <Link href="/hr/late-today" className="text-sm font-semibold text-indigo-600">See all</Link>
          </div>
          <LateRankList mode="today" items={lateToday} compact />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: '/hr/late-leaderboard', title: 'Late leaderboard', sub: 'All-time ranking' },
            { href: '/hr/employees', title: 'All employees', sub: 'Browse directory' },
            { href: '/hr/employees/register', title: 'Register employee', sub: 'Add new account' },
            { href: '/hr/work-hours', title: 'Work hours', sub: 'Attendance rules' },
            { href: '/hr/feedback', title: 'Feedback forms', sub: 'Create & analyze' },
            { href: '/hr/geofence', title: 'Geofence', sub: 'Office locations' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="transition hover:border-indigo-300">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.sub}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </HrGuard>
  );
}
