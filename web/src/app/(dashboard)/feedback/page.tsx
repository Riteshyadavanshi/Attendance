'use client';

import { ClipboardList, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function FeedbackListPage() {
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackFormsApi
      .listActive()
      .then((d) => setForms(Array.isArray(d) ? d : []))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Feedback forms" description="Share your feedback with HR." />

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList className="h-6 w-6" />
          </span>
          <p className="font-semibold text-foreground">No active forms</p>
          <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {forms.map((f) => (
            <Link key={f.id} href={`/feedback/${f.id}?title=${encodeURIComponent(f.title)}`}>
              <Card className="flex items-center gap-3 transition hover:border-primary/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{f.title}</p>
                  {f.description && (
                    <p className="truncate text-sm text-muted-foreground">{f.description}</p>
                  )}
                </div>
                {f.already_submitted && <Badge tone="success">Submitted</Badge>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
