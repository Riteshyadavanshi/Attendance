'use client';

import {
  ArrowDown,
  ArrowUp,
  CircleDot,
  GripVertical,
  ListChecks,
  Plus,
  Star,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { FeedbackQuestion } from '@/lib/api';
import { cn } from '@/lib/utils';

type QType = FeedbackQuestion['type'];

const TYPE_META: Record<QType, { label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = {
  rating: { label: 'Rating (1–5)', icon: Star, hint: 'Star scale from 1 to 5' },
  text: { label: 'Short / long text', icon: Type, hint: 'Free text answer' },
  choice: { label: 'Multiple choice', icon: ListChecks, hint: 'Pick one option' },
};

function makeQuestion(type: QType): FeedbackQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: '',
    required: true,
    options: type === 'choice' ? ['Option 1', 'Option 2'] : undefined,
  };
}

export type FeedbackFormDraft = {
  title: string;
  description: string;
  questions: FeedbackQuestion[];
};

function QuestionPreview({ question }: { question: FeedbackQuestion }) {
  if (question.type === 'rating') {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="h-5 w-5 text-muted-foreground/50" />
        ))}
      </div>
    );
  }
  if (question.type === 'text') {
    return <div className="h-9 w-full rounded-lg border border-dashed border-border bg-muted/40" />;
  }
  return (
    <div className="space-y-1.5">
      {(question.options ?? []).map((opt, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleDot className="h-4 w-4" /> {opt || `Option ${i + 1}`}
        </div>
      ))}
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: FeedbackQuestion;
  index: number;
  total: number;
  onChange: (patch: Partial<FeedbackQuestion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const Meta = TYPE_META[question.type];

  const setType = (type: QType) => {
    onChange({
      type,
      options: type === 'choice' ? question.options ?? ['Option 1', 'Option 2'] : undefined,
    });
  };

  const updateOption = (i: number, value: string) => {
    const options = [...(question.options ?? [])];
    options[i] = value;
    onChange({ options });
  };

  const addOption = () =>
    onChange({ options: [...(question.options ?? []), `Option ${(question.options?.length ?? 0) + 1}`] });

  const removeOption = (i: number) =>
    onChange({ options: (question.options ?? []).filter((_, idx) => idx !== i) });

  return (
    <Card className="flex flex-col gap-4 border-l-4 border-l-primary/70">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Badge tone="primary">
          <Meta.icon className="h-3 w-3" /> Q{index + 1}
        </Badge>
        <span className="text-xs text-muted-foreground">{Meta.hint}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={total === 1}
            aria-label="Delete question"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <FormField label="Question">
          <Input
            value={question.label}
            placeholder="e.g. How satisfied were you?"
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </FormField>
        <FormField label="Type">
          <Select value={question.type} onChange={(e) => setType(e.target.value as QType)}>
            {(Object.keys(TYPE_META) as QType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {question.type === 'choice' && (
        <FormField label="Options">
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(i)}
                  disabled={(question.options?.length ?? 0) <= 2}
                  aria-label="Remove option"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addOption} className="self-start text-primary">
              <Plus className="h-4 w-4" /> Add option
            </Button>
          </div>
        </FormField>
      )}

      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <div className="text-xs text-muted-foreground">Preview</div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          Required
          <Switch checked={question.required} onCheckedChange={(v) => onChange({ required: v })} />
        </label>
      </div>
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-sm font-medium text-foreground">
          {question.label || 'Untitled question'}
          {question.required && <span className="ml-1 text-destructive">*</span>}
        </p>
        <QuestionPreview question={question} />
      </div>
    </Card>
  );
}

export function FeedbackFormBuilder({
  initial,
  submitLabel = 'Publish form',
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: FeedbackFormDraft;
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (draft: FeedbackFormDraft) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [questions, setQuestions] = useState<FeedbackQuestion[]>(
    initial?.questions?.length ? initial.questions : [makeQuestion('rating')],
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const patchQuestion = (id: string, patch: Partial<FeedbackQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id: string) =>
    setQuestions((qs) => (qs.length > 1 ? qs.filter((q) => q.id !== id) : qs));

  const moveQuestion = (index: number, dir: -1 | 1) =>
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addQuestion = (type: QType) => setQuestions((qs) => [...qs, makeQuestion(type)]);

  const handleSubmit = () => {
    if (!title.trim()) {
      setLocalError('Add a form title.');
      return;
    }
    if (questions.some((q) => !q.label.trim())) {
      setLocalError('Every question needs a label.');
      return;
    }
    if (questions.some((q) => q.type === 'choice' && (q.options ?? []).some((o) => !o.trim()))) {
      setLocalError('Choice options cannot be empty.');
      return;
    }
    setLocalError(null);
    onSubmit({ title: title.trim(), description: description.trim(), questions });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 border-t-4 border-t-primary">
        <FormField label="Form title">
          <Input
            value={title}
            placeholder="Untitled feedback form"
            onChange={(e) => setTitle(e.target.value)}
            className="text-base font-semibold"
          />
        </FormField>
        <FormField label="Description (optional)">
          <Textarea
            value={description}
            placeholder="What is this form about?"
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
      </Card>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            onChange={(patch) => patchQuestion(q.id, patch)}
            onRemove={() => removeQuestion(q.id)}
            onMove={(dir) => moveQuestion(i, dir)}
          />
        ))}
      </div>

      <Card className="border-dashed">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Add a question</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as QType[]).map((t) => {
            const Meta = TYPE_META[t];
            return (
              <Button key={t} type="button" variant="outline" size="sm" onClick={() => addQuestion(t)}>
                <Meta.icon className="h-4 w-4" /> {Meta.label}
              </Button>
            );
          })}
        </div>
      </Card>

      {(localError || error) && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {localError || error}
        </p>
      )}

      <div className={cn('flex gap-2', onCancel ? 'justify-between' : 'justify-end')}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
