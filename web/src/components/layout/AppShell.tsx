'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlarmClock,
  Calendar,
  Clock,
  Fingerprint,
  Grid3X3,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plane,
  School,
  Trophy,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const EMPLOYEE_NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/attendance', label: 'History', icon: Calendar },
  { href: '/feedback', label: 'Feedback', icon: School },
  { href: '/leave', label: 'Leave', icon: Plane },
  { href: '/profile', label: 'Profile', icon: User },
];

const HR_NAV = [
  { href: '/hr', label: 'HR Dashboard', icon: Grid3X3 },
  { href: '/hr/employees', label: 'All Employees', icon: Users },
  { href: '/hr/employees/register', label: 'Register', icon: UserPlus },
  { href: '/hr/feedback', label: 'Feedback Forms', icon: MessageSquare },
  { href: '/hr/work-hours', label: 'Work Hours', icon: Clock },
  { href: '/hr/late-today', label: 'Late Today', icon: AlarmClock },
  { href: '/hr/late-leaderboard', label: 'Late Leaderboard', icon: Trophy },
  { href: '/hr/geofence', label: 'Geofence', icon: MapPin },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isHr = useAuthStore((s) => s.isHr);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const initials = (user?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">HR Attendance</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</p>
        {EMPLOYEE_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileOpen(false)} />
        ))}
        {isHr() && (
          <>
            <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              HR Admin
            </p>
            {HR_NAV.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} onClick={() => setMobileOpen(false)} />
            ))}
          </>
        )}
      </nav>
      <div className="space-y-3 border-t border-border p-3">
        <ThemeToggle className="w-full justify-between" />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="flex-1 truncate text-sm font-semibold text-foreground">
            {user?.full_name ?? user?.email ?? 'Workspace'}
          </p>
          <div className="hidden sm:block lg:hidden">
            <ThemeToggle />
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials}
          </span>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {EMPLOYEE_NAV.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        {isHr() && (
          <Link
            href="/hr"
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              pathname.startsWith('/hr') ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Grid3X3 className="h-5 w-5" />
            HR
          </Link>
        )}
      </nav>
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />
    </div>
  );
}
