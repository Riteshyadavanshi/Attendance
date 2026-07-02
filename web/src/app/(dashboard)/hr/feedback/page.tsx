'use client';

import { FileEdit, Lock, MessageSquarePlus, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { HrGuard } from '@/components/layout/HrGuard';
import { PageHeader } from '@/components/layout/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { feedbackFormsApi, type FeedbackFormRecord } from '@/lib/api';

export default function HRFeedbackListPage() {
  const toast = useToast();
  const [forms, setForms] = useState<FeedbackFormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<FeedbackFormRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackFormsApi.listHr(1, 50);
      setForms(data.items);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await feedbackFormsApi.remove(toDelete.id);
      setForms((prev) => prev.filter((f) => f.id !== toDelete.id));
      toast.success('Feedback form deleted.');
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <HrGuard>
      <>
        <PageHeader
          title="Feedback forms"
          description="Create, edit, and analyze employee feedback."
          actions={
            <Link href="/hr/feedback/new">
              <Button>
                <Plus className="h-4 w-4" /> Create form
              </Button>
            </Link>
          }
        />

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : forms.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquarePlus className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-foreground">No feedback forms yet</p>
              <p className="text-sm text-muted-foreground">Create your first Google-Forms-style survey.</p>
            </div>
            <Link href="/hr/feedback/new">
              <Button>
                <Plus className="h-4 w-4" /> Create form
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {forms.map((f) => {
              const locked = f.response_count > 0;
              return (
                <Card key={f.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/hr/feedback/${f.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground hover:text-primary">{f.title}</p>
                      {f.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{f.description}</p>
                      )}
                    </Link>
                    <Badge tone={f.is_active ? 'success' : 'muted'}>{f.is_active ? 'Active' : 'Closed'}</Badge>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" /> {f.response_count} response{f.response_count === 1 ? '' : 's'}
                    </span>
                    <span>·</span>
                    <span>{f.questions.length} question{f.questions.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Link href={`/hr/feedback/${f.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        View results
                      </Button>
                    </Link>
                    {locked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Cannot edit a form that already has responses"
                      >
                        <Lock className="h-4 w-4" /> Edit
                      </Button>
                    ) : (
                      <Link href={`/hr/feedback/${f.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <FileEdit className="h-4 w-4" /> Edit
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setToDelete(f)}
                      aria-label="Delete form"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete feedback form?"
        description={
          toDelete
            ? `"${toDelete.title}" and its ${toDelete.response_count} response${
                toDelete.response_count === 1 ? '' : 's'
              } will be permanently deleted.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </HrGuard>
  );
}
