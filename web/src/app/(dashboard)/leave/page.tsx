import { Plane } from 'lucide-react';

import { PageHeader } from '@/components/layout/page';
import { Card } from '@/components/ui/card';

export default function LeavePage() {
  return (
    <>
      <PageHeader title="Leave" description="Apply and track leave requests." />
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Plane className="h-6 w-6" />
        </span>
        <p className="font-semibold text-foreground">Coming soon</p>
        <p className="text-sm text-muted-foreground">Apply and track leave requests from this screen.</p>
      </Card>
    </>
  );
}
