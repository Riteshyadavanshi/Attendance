'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';

export function HrGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isHr = useAuthStore((s) => s.isHr);

  useEffect(() => {
    if (hydrated && !isHr()) router.replace('/');
  }, [hydrated, isHr, router]);

  if (!hydrated || !isHr()) {
    return <p className="text-sm text-slate-500">Checking access…</p>;
  }

  return <>{children}</>;
}
