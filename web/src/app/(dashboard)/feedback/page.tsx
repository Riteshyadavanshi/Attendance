'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function FeedbackListPage() {
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);

  useEffect(() => {
    feedbackFormsApi.listActive().then((d) => setForms(Array.isArray(d) ? d : [])).catch(() => setForms([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Feedback forms</h1>
      {forms.length === 0 ? (
        <Card><p className="text-sm text-slate-500">No active forms.</p></Card>
      ) : (
        <div className="space-y-2">
          {forms.map((f) => (
            <Link key={f.id} href={`/feedback/${f.id}?title=${encodeURIComponent(f.title)}`}>
              <Card className="transition hover:border-indigo-300">
                <p className="font-semibold text-slate-900">{f.title}</p>
                {f.description && <p className="mt-1 text-sm text-slate-500">{f.description}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
