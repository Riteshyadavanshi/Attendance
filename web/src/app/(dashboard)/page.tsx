'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { attendanceApi, faceApi } from '@/lib/api';
import { formatStatus, formatTime } from '@/lib/format';

export default function HomePage() {
  const [today, setToday] = useState<Record<string, unknown> | null>(null);
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, f] = await Promise.all([attendanceApi.today(), faceApi.status()]);
        setToday(t);
        setFaceEnrolled(f.face_enrolled);
      } catch {
        setToday({ status: 'not_checked_in' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const status = String(today?.status ?? (loading ? 'loading' : 'not_checked_in'));
  const checkedIn = today?.check_in_at;
  const checkedOut = today?.check_out_at;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Home</h1>
        <p className="text-sm text-slate-500">Today&apos;s attendance overview</p>
      </div>

      {faceEnrolled === false && (
        <Card accent className="border-indigo-200 bg-indigo-50">
          <p className="font-semibold text-slate-900">Face enrollment required</p>
          <p className="mt-1 text-sm text-slate-600">Complete 5-angle setup before check-in.</p>
          <Link href="/face-enroll" className="mt-3 inline-block">
            <Button>Enroll now</Button>
          </Link>
        </Card>
      )}

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today&apos;s status</p>
        <p className="mt-2 text-3xl font-extrabold capitalize text-indigo-700">{formatStatus(status)}</p>
        {checkedIn != null && checkedIn !== '' && (
          <p className="mt-2 text-sm text-slate-600">In: {formatTime(today?.check_in_at)}</p>
        )}
        {checkedOut != null && checkedOut !== '' && (
          <p className="text-sm text-slate-600">Out: {formatTime(today?.check_out_at)}</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        {!checkedIn && (
          <Link href="/check-in">
            <Button disabled={faceEnrolled === false}>Check in</Button>
          </Link>
        )}
        {Boolean(checkedIn) && !Boolean(checkedOut) && (
          <Link href="/check-out">
            <Button variant="danger">Check out</Button>
          </Link>
        )}
        <Link href="/face-enroll">
          <Button variant="outline">Update face enrollment</Button>
        </Link>
      </div>
    </div>
  );
}
