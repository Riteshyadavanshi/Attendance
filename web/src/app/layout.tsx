import type { Metadata } from 'next';

import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'HR Attendance',
  description: 'Smart attendance and workforce management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="theme-transition">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
