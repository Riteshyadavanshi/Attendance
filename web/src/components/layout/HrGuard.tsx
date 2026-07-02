'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { isHrRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/authStore';

export function HrGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hrAccess = Boolean(user?.roles?.length && isHrRole(user.roles));

  useEffect(() => {
    if (accessToken && user && !hrAccess) {
      router.replace('/');
    }
  }, [accessToken, user, hrAccess, router]);

  if (!accessToken || !user || !hrAccess) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Checking access…</p>;
  }

  return <>{children}</>;
}
