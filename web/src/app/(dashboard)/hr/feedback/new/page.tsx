'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FeedbackFormBuilder, type FeedbackFormDraft } from '@/components/feedback/FeedbackFormBuilder';
import { HrGuard } from '@/components/layout/HrGuard';
import { BackLink, Narrow, PageHeader } from '@/components/layout/page';
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
      <Narrow>
        <BackLink href="/hr/feedback">Feedback forms</BackLink>
        <PageHeader
          title="Create feedback form"
          description="Build a form with rating, text, and multiple-choice questions."
        />
        <FeedbackFormBuilder
          submitLabel="Publish form"
          submitting={submitting}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => router.push('/hr/feedback')}
        />
      </Narrow>
    </HrGuard>
  );
}
