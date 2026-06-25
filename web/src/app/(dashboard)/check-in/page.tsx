'use client';

import { useEffect, useState } from 'react';

import { CheckInPanel } from '@/components/attendance/CheckInPanel';

export default function CheckInPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Check in</h1>
      <CheckInPanel mode="in" />
    </div>
  );
}
