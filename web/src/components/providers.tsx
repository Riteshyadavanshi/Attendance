'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

import { FeedbackFormPopup } from '@/components/feedback/FeedbackFormPopup';
import { ToastProvider } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/authStore';

function AuthHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() =>
    typeof window !== 'undefined' ? useAuthStore.persist.hasHydrated() : false,
  );

  useEffect(() => {
    const markReady = () => {
      useAuthStore.getState().setHydrated(true);
      setReady(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      markReady();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(markReady);
    void useAuthStore.persist.rehydrate();
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthHydration>
            {children}
            <FeedbackFormPopup />
          </AuthHydration>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
