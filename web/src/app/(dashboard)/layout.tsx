import { AppShell } from '@/components/layout/AppShell';
import { Page } from '@/components/layout/page';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Page>{children}</Page>
    </AppShell>
  );
}
