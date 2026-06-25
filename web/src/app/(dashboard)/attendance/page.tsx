'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { attendanceApi } from '@/lib/api';
import { formatDate, formatStatus, formatTime } from '@/lib/format';

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'muted' {
  const s = status.toLowerCase();
  if (s.includes('present') || s.includes('full')) return 'success';
  if (s.includes('half') || s.includes('late')) return 'warning';
  if (s.includes('absent')) return 'danger';
  return 'muted';
}

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .history()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance history</h1>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : records.length === 0 ? (
        <Card><p className="text-sm text-muted-foreground">No records yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={String(r.id)}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{formatDate(r.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.check_in_at ? formatTime(r.check_in_at) : '—'}
                    {' → '}
                    {r.check_out_at ? formatTime(r.check_out_at) : '—'}
                  </p>
                </div>
                <Badge tone={statusTone(String(r.status))}>{formatStatus(r.status)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
