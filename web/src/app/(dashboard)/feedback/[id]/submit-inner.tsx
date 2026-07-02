'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink, Narrow, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Select, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n}`}
          className="transition hover:scale-110"
        >
          <Star
            className={cn(
              'h-8 w-8',
              n <= value ? 'fill-warning text-warning' : 'text-muted-foreground/40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function SubmitFeedbackInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const title = searchParams.get('title');
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    feedbackFormsApi
      .get(id)
      .then(setForm)
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feedbackFormsApi.submit(id, answers);
      toast.success('Thanks for your feedback!');
      setDone(true);
      setTimeout(() => router.push('/feedback'), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Narrow>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </Narrow>
    );
  }

  if (!form) {
    return (
      <Card>
        <p className="text-sm text-destructive">Form not found.</p>
      </Card>
    );
  }

  if (done || form.already_submitted) {
    return (
      <Narrow>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Star className="h-6 w-6" />
          </span>
          <p className="font-semibold text-foreground">Thanks for your feedback!</p>
          <Link href="/feedback">
            <Button variant="outline">Back to forms</Button>
          </Link>
        </Card>
      </Narrow>
    );
  }

  return (
    <Narrow>
      <BackLink href="/feedback">Feedback</BackLink>
      <PageHeader
        title={title ?? form.title}
        description={form.description ?? undefined}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {form.questions.map((q) => (
          <Card key={q.id} className="border-l-4 border-l-primary/60">
            <FormField
              label={
                <>
                  {q.label}
                  {q.required ? <span className="ml-1 text-destructive">*</span> : null}
                </>
              }
            >
              {q.type === 'text' && (
                <Textarea
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required={q.required}
                />
              )}
              {q.type === 'rating' && (
                <RatingInput
                  value={Number(answers[q.id] ?? 0)}
                  onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                />
              )}
              {q.type === 'choice' && q.options && (
                <Select
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required={q.required}
                >
                  <option value="">Select…</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          </Card>
        ))}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting…' : 'Submit feedback'}
        </Button>
      </form>
    </Narrow>
  );
}
