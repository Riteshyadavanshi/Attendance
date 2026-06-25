'use client';

import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { FeedbackFormBuilder, type FeedbackFormDraft } from '@/components/feedback/FeedbackFormBuilder';
import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function EditFeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feedbackFormsApi
      .get(id)
      .then(setForm)
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (draft: FeedbackFormDraft) => {
    setSubmitting(true);
    setError(null);
    try {
      await feedbackFormsApi.update(id, {
        title: draft.title,
        description: draft.description || null,
        questions: draft.questions,
      });
      router.push(`/hr/feedback/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      setSubmitting(false);
    }
  };

  const locked = (form?.response_count ?? 0) > 0;

  return (
    <HrGuard>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Link
            href={`/hr/feedback/${id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to form
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Edit feedback form</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !form ? (
          <Card><p className="text-sm text-destructive">Form not found.</p></Card>
        ) : locked ? (
          <Card className="space-y-3 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Lock className="h-6 w-6" />
            </span>
            <p className="font-semibold text-foreground">This form is locked</p>
            <p className="text-sm text-muted-foreground">
              It already has {form.response_count} response{form.response_count === 1 ? '' : 's'}, so the questions
              can no longer be edited. Delete it and create a new one if you need changes.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push(`/hr/feedback/${id}`)}>
                View responses
              </Button>
            </div>
          </Card>
        ) : (
          <FeedbackFormBuilder
            initial={{
              title: form.title,
              description: form.description ?? '',
              questions: form.questions,
            }}
            submitLabel="Save changes"
            submitting={submitting}
            error={error}
            onSubmit={onSubmit}
            onCancel={() => router.push(`/hr/feedback/${id}`)}
          />
        )}
      </div>
    </HrGuard>
  );
}
