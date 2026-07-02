'use client';

import { Camera, CheckCircle2, Clock, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
    <>
      <PageHeader title="Home" description="Today's attendance overview" />

      {faceEnrolled === false && (
        <Card accent>
          <p className="font-semibold text-foreground">Face enrollment required</p>
          <p className="mt-1 text-sm text-muted-foreground">Complete 5-angle setup before check-in.</p>
          <Link href="/face-enroll" className="mt-3 inline-block">
            <Button>
              <Camera className="h-4 w-4" /> Enroll now
            </Button>
          </Link>
        </Card>
      )}

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Today&apos;s status
          </p>
          <p className="mt-2 text-3xl font-extrabold capitalize text-primary">{formatStatus(status)}</p>
          {checkedIn != null && checkedIn !== '' && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <LogIn className="h-4 w-4 text-success" /> In: {formatTime(today?.check_in_at)}
            </p>
          )}
          {checkedOut != null && checkedOut !== '' && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LogOut className="h-4 w-4 text-destructive" /> Out: {formatTime(today?.check_out_at)}
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {!checkedIn && (
          <Link href="/check-in">
            <Button disabled={faceEnrolled === false}>
              <LogIn className="h-4 w-4" /> Check in
            </Button>
          </Link>
        )}
        {Boolean(checkedIn) && !Boolean(checkedOut) && (
          <Link href="/check-out">
            <Button variant="danger">
              <LogOut className="h-4 w-4" /> Check out
            </Button>
          </Link>
        )}
        {Boolean(checkedIn) && Boolean(checkedOut) && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/12 px-3 py-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" /> Day complete
          </span>
        )}
        <Link href="/face-enroll">
          <Button variant="outline">
            <Camera className="h-4 w-4" /> Update face enrollment
          </Button>
        </Link>
      </div>
    </>
  );
}
