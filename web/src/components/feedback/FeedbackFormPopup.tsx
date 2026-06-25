'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function FeedbackFormPopup() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHr = useAuthStore((s) => s.isHr);
  const [queue, setQueue] = useState<FeedbackFormRecord[]>([]);
  const current = queue[0] ?? null;

  const loadPending = useCallback(async () => {
    if (!accessToken || isHr()) return;
    try {
      const items = await feedbackFormsApi.popupPending();
      setQueue(Array.isArray(items) ? items : []);
    } catch {
      setQueue([]);
    }
  }, [accessToken, isHr]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const onDismiss = async () => {
    if (!current) return;
    try {
      await feedbackFormsApi.dismissPopup(current.id);
    } catch {
      // advance locally
    }
    setQueue((prev) => prev.slice(1));
  };

  const onFill = () => {
    if (!current) return;
    const { id, title } = current;
    setQueue((prev) => prev.slice(1));
    router.push(`/feedback/${id}?title=${encodeURIComponent(title)}`);
  };

  if (!accessToken || isHr() || !current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
        <h2 className="text-lg font-bold text-foreground">New feedback form</h2>
        <p className="mt-2 text-sm text-foreground">{current.title}</p>
        {current.description && (
          <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
        )}
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button className="flex-1" onClick={onFill}>
            Fill form
          </Button>
        </div>
        <Link href="/feedback" className="mt-3 block text-center text-xs text-primary">
          View all forms
        </Link>
      </div>
    </div>
  );
}
