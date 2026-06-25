'use client';

import { ArrowLeft, FileEdit, Lock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  feedbackFormsApi,
  type FeedbackFormDashboard,
  type FeedbackFormRecord,
  type FeedbackQuestionStat,
  type FeedbackSubmission,
} from '@/lib/api';
import { formatDateTime } from '@/lib/format';

function RatingStat({ q }: { q: FeedbackQuestionStat }) {
  const dist = q.distribution ?? {};
  const max = Math.max(1, ...Object.values(dist));
  return (
    <div className="space-y-2">
      {q.average != null && (
        <p className="text-2xl font-extrabold text-primary">
          {q.average.toFixed(1)} <span className="text-sm font-medium text-muted-foreground">avg</span>
        </p>
      )}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = dist[String(n)] ?? 0;
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceStat({ q }: { q: FeedbackQuestionStat }) {
  const counts = q.option_counts ?? {};
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="space-y-1.5">
      {Object.entries(counts).map(([opt, count]) => (
        <div key={opt} className="text-xs">
          <div className="mb-0.5 flex justify-between">
            <span className="text-foreground">{opt}</span>
            <span className="text-muted-foreground">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TextStat({ q }: { q: FeedbackQuestionStat }) {
  if (!q.recent_texts?.length) {
    return <p className="text-sm text-muted-foreground">No text answers yet.</p>;
  }
  return (
    <div className="space-y-1.5">
      {q.recent_texts.map((t, i) => (
        <p key={i} className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">
          “{t}”
        </p>
      ))}
    </div>
  );
}

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [dashboard, setDashboard] = useState<FeedbackFormDashboard | null>(null);
  const [responses, setResponses] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      feedbackFormsApi.get(id),
      feedbackFormsApi.dashboard(id),
      feedbackFormsApi.responses(id, 1, 20),
    ])
      .then(([f, d, r]) => {
        setForm(f);
        setDashboard(d);
        setResponses(r.items);
      })
      .catch(() => {
        setDashboard(null);
        setResponses([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const locked = (form?.response_count ?? dashboard?.total_responses ?? 0) > 0;

  const toggleActive = async (active: boolean) => {
    setTogglingActive(true);
    try {
      const updated = await feedbackFormsApi.update(id, { is_active: active });
      setForm(updated);
    } finally {
      setTogglingActive(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await feedbackFormsApi.remove(id);
      router.push('/hr/feedback');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-5">
        <Link
          href="/hr/feedback"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Feedback forms
        </Link>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        ) : !dashboard ? (
          <Card><p className="text-sm text-destructive">Form not found.</p></Card>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{dashboard.title}</h1>
                  {form && (
                    <Badge tone={form.is_active ? 'success' : 'muted'}>
                      {form.is_active ? 'Active' : 'Closed'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{dashboard.total_responses} total responses</p>
              </div>
              <div className="flex items-center gap-2">
                {form && (
                  <label className="mr-1 flex items-center gap-2 text-sm text-muted-foreground">
                    Open
                    <Switch checked={form.is_active} onCheckedChange={toggleActive} />
                  </label>
                )}
                {locked ? (
                  <Button variant="ghost" size="sm" disabled title="Cannot edit a form that has responses">
                    <Lock className="h-4 w-4" /> Edit
                  </Button>
                ) : (
                  <Link href={`/hr/feedback/${id}/edit`}>
                    <Button variant="outline" size="sm">
                      <FileEdit className="h-4 w-4" /> Edit
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Delete form"
                  disabled={togglingActive}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {dashboard.questions.map((q) => (
                <Card key={q.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{q.label}</p>
                    <Badge tone="muted">{q.type}</Badge>
                  </div>
                  {q.type === 'rating' && <RatingStat q={q} />}
                  {q.type === 'choice' && <ChoiceStat q={q} />}
                  {q.type === 'text' && <TextStat q={q} />}
                </Card>
              ))}
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-foreground">Recent responses</h2>
              {responses.length === 0 ? (
                <Card><p className="text-sm text-muted-foreground">No responses yet.</p></Card>
              ) : (
                <div className="space-y-2">
                  {responses.map((r) => (
                    <Card key={r.id}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{r.employee_name ?? 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.submitted_at ? formatDateTime(r.submitted_at) : ''}
                        </p>
                      </div>
                      <dl className="mt-2 space-y-1">
                        {dashboard.questions.map((q) => (
                          <div key={q.id} className="flex gap-2 text-sm">
                            <dt className="text-muted-foreground">{q.label}:</dt>
                            <dd className="font-medium text-foreground">{String(r.answers[q.id] ?? '—')}</dd>
                          </div>
                        ))}
                      </dl>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete feedback form?"
        description={`This permanently deletes the form and ${dashboard?.total_responses ?? 0} response(s).`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </HrGuard>
  );
}
