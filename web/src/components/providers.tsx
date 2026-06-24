'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { FeedbackFormPopup } from '@/components/feedback/FeedbackFormPopup';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <FeedbackFormPopup />
    </QueryClientProvider>
  );
}
