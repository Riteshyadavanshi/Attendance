'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Card } from '@/components/ui/card';
import { feedbackFormsApi, type FeedbackFormDashboard, type FeedbackSubmission } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [dashboard, setDashboard] = useState<FeedbackFormDashboard | null>(null);
  const [responses, setResponses] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      feedbackFormsApi.dashboard(id),
      feedbackFormsApi.responses(id, 1, 20),
    ])
      .then(([d, r]) => {
        setDashboard(d);
        setResponses(r.items);
      })
      .catch(() => {
        setDashboard(null);
        setResponses([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <HrGuard>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : !dashboard ? (
          <p className="text-sm text-red-600">Form not found.</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{dashboard.title}</h1>
            <p className="text-sm text-slate-500">{dashboard.total_responses} responses</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboard.questions.map((q) => (
                <Card key={q.id}>
                  <p className="font-semibold text-slate-900">{q.label}</p>
                  <p className="text-sm text-slate-500">{q.response_count} answers</p>
                  {q.average != null && <p className="text-lg font-bold text-indigo-600">Avg: {q.average.toFixed(1)}</p>}
                </Card>
              ))}
            </div>
            <h2 className="text-lg font-bold text-slate-900">Recent responses</h2>
            {responses.length === 0 ? (
              <Card><p className="text-sm text-slate-500">No responses yet.</p></Card>
            ) : (
              <div className="space-y-2">
                {responses.map((r) => (
                  <Card key={r.id}>
                    <p className="font-semibold text-slate-900">{r.employee_name ?? 'Anonymous'}</p>
                    <p className="text-xs text-slate-500">{r.submitted_at ? formatDateTime(r.submitted_at) : ''}</p>
                    <pre className="mt-2 overflow-x-auto text-xs text-slate-600">{JSON.stringify(r.answers, null, 2)}</pre>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </HrGuard>
  );
}
