'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { feedbackFormsApi, type FeedbackQuestion } from '@/lib/api';

export default function CreateFeedbackPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionLabel, setQuestionLabel] = useState('');
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    if (!questionLabel.trim()) return;
    setQuestions((q) => [
      ...q,
      {
        id: `q${q.length + 1}`,
        type: 'rating',
        label: questionLabel.trim(),
        required: true,
      },
    ]);
    setQuestionLabel('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) {
      setError('Add a title and at least one question.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = await feedbackFormsApi.create({ title: title.trim(), description, questions });
      router.push(`/hr/feedback/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HrGuard>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Create feedback form</h1>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="flex gap-2">
              <Input
                placeholder="Question label"
                value={questionLabel}
                onChange={(e) => setQuestionLabel(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addQuestion}>Add</Button>
            </div>
            <ul className="space-y-1 text-sm text-slate-600">
              {questions.map((q) => (
                <li key={q.id}>• {q.label} (rating)</li>
              ))}
            </ul>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create form'}</Button>
          </form>
        </Card>
      </div>
    </HrGuard>
  );
}
