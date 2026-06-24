'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function HRFeedbackListPage() {
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackFormsApi.listHr(1, 50);
      setForms(data.items);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <HrGuard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Feedback forms</h1>
          <Link href="/hr/feedback/new"><Button>Create form</Button></Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : forms.length === 0 ? (
          <Card><p className="text-sm text-slate-500">No forms yet.</p></Card>
        ) : (
          <div className="space-y-2">
            {forms.map((f) => (
              <Link key={f.id} href={`/hr/feedback/${f.id}`}>
                <Card className="transition hover:border-indigo-300">
                  <p className="font-semibold text-slate-900">{f.title}</p>
                  <p className="text-sm text-slate-500">{f.response_count} responses</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HrGuard>
  );
}
