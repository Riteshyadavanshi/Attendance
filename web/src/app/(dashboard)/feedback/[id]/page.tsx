'use client';

import { Suspense } from 'react';

import SubmitFeedbackInner from './submit-inner';

export default function SubmitFeedbackPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <SubmitFeedbackInner />
    </Suspense>
  );
}
