'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function SubmitFeedbackInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const title = searchParams.get('title');
  const [form, setForm] = useState<FeedbackFormRecord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(null);
    try {
      await feedbackFormsApi.submit(id, answers);
      setMessage('Submitted successfully!');
      setTimeout(() => router.push('/feedback'), 1000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!form) return <p className="text-sm text-red-600">Form not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{title ?? form.title}</h1>
      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {form.questions.map((q) => (
            <div key={q.id}>
              <Label>{q.label}{q.required ? ' *' : ''}</Label>
              {q.type === 'text' && (
                <Textarea
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required={q.required}
                />
              )}
              {q.type === 'rating' && (
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: Number(e.target.value) }))}
                  required={q.required}
                />
              )}
              {q.type === 'choice' && q.options && (
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={String(answers[q.id] ?? '')}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required={q.required}
                >
                  <option value="">Select…</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          {message && <p className="text-sm text-indigo-700">{message}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Button>
        </form>
      </Card>
    </div>
  );
}
