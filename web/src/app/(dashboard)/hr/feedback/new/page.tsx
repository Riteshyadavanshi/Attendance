'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FeedbackFormBuilder, type FeedbackFormDraft } from '@/components/feedback/FeedbackFormBuilder';
import { HrGuard } from '@/components/layout/HrGuard';
import { useToast } from '@/components/ui/toast';
import { feedbackFormsApi } from '@/lib/api';

export default function CreateFeedbackPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (draft: FeedbackFormDraft) => {
    setSubmitting(true);
    setError(null);
    try {
      const form = await feedbackFormsApi.create({
        title: draft.title,
        description: draft.description || undefined,
        questions: draft.questions,
      });
      toast.success('Feedback form published.');
      router.push(`/hr/feedback/${form.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Create failed';
      setError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <HrGuard>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Link
            href="/hr/feedback"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Feedback forms
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Create feedback form</h1>
          <p className="text-sm text-muted-foreground">Build a form with rating, text, and multiple-choice questions.</p>
        </div>
        <FeedbackFormBuilder
          submitLabel="Publish form"
          submitting={submitting}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => router.push('/hr/feedback')}
        />
      </div>
    </HrGuard>
  );
}
