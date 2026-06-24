'use client';

import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { attendanceApi } from '@/lib/api';
import { formatDate, formatStatus, formatTime } from '@/lib/format';

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
      <h1 className="text-2xl font-bold text-slate-900">Attendance history</h1>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : records.length === 0 ? (
        <Card><p className="text-sm text-slate-500">No records yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={String(r.id)}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{formatDate(r.date)}</p>
                  <p className="text-sm text-slate-500">
                    {r.check_in_at ? formatTime(r.check_in_at) : '—'}
                    {' → '}
                    {r.check_out_at ? formatTime(r.check_out_at) : '—'}
                  </p>
                </div>
                <p className="text-sm font-bold capitalize text-indigo-600">{formatStatus(r.status)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
