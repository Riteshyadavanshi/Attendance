'use client';

import { Suspense } from 'react';

import SubmitFeedbackInner from './submit-inner';

export default function SubmitFeedbackPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <SubmitFeedbackInner />
    </Suspense>
  );
}
