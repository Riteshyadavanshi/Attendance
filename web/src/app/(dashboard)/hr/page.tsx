'use client';

import { ArrowRight, Clock, MapPin, MessageSquare, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LateRankList } from '@/components/hr/LateLeaderboardList';
import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Card, StatCard } from '@/components/ui/card';
import { attendanceApi, type LateTodayEntry } from '@/lib/api';

const QUICK_LINKS = [
  { href: '/hr/late-leaderboard', title: 'Late leaderboard', sub: 'All-time ranking', icon: Users },
  { href: '/hr/employees', title: 'All employees', sub: 'Browse directory', icon: Users },
  { href: '/hr/employees/register', title: 'Register employee', sub: 'Add new account', icon: UserPlus },
  { href: '/hr/work-hours', title: 'Work hours', sub: 'Attendance rules', icon: Clock },
  { href: '/hr/feedback', title: 'Feedback forms', sub: 'Create & analyze', icon: MessageSquare },
  { href: '/hr/geofence', title: 'Geofence', sub: 'Office locations', icon: MapPin },
];

export default function HRDashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [lateToday, setLateToday] = useState<LateTodayEntry[]>([]);

  useEffect(() => {
    attendanceApi.dashboard().then(setStats).catch(() => setStats({}));
    attendanceApi.lateToday().then((d) => setLateToday((d.items ?? []).slice(0, 5))).catch(() => setLateToday([]));
  }, []);

  return (
    <HrGuard>
      <>
        <PageHeader title="HR Dashboard" description="Today's overview" />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total employees" value={String(stats.total_employees ?? '—')} />
          <StatCard label="Present today" value={String(stats.present ?? '—')} color="text-success" />
          <StatCard label="Absent today" value={String(stats.absent ?? '—')} color="text-destructive" />
          <Link href="/hr/late-today">
            <StatCard label="Late today" value={String(stats.late ?? '—')} color="text-warning" />
          </Link>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Late today</h2>
            <Link href="/hr/late-today" className="text-sm font-semibold text-primary">
              See all
            </Link>
          </div>
          <LateRankList mode="today" items={lateToday} compact />
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="flex items-center gap-3 transition hover:border-primary/50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      </>
    </HrGuard>
  );
}
