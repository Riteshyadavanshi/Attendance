'use client';

import { useEffect, useState } from 'react';

import { CheckInPanel } from '@/components/attendance/CheckInPanel';
import { PageHeader } from '@/components/layout/page';

export default function CheckInPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <>
      <PageHeader
        title="Check in"
        description="Verify your face and confirm you are at the office location."
      />
      <CheckInPanel mode="in" />
    </>
  );
}
