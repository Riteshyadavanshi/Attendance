'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlarmClock,
  Calendar,
  Fingerprint,
  Grid3X3,
  Home,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plane,
  Trophy,
  User,
  UserPlus,
  Users,
  Clock,
  School,
} from 'lucide-react';
import { useState } from 'react';

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
        active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
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

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Fingerprint className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">HR Attendance</p>
          <p className="text-xs text-slate-500 truncate max-w-[140px]">{user?.email}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Employee</p>
        {EMPLOYEE_NAV.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onClick={() => setMobileOpen(false)}
          />
        ))}
        {isHr() && (
          <>
            <p className="mt-4 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">HR Admin</p>
            {HR_NAV.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </>
        )}
      </nav>
      <div className="border-t border-slate-200 p-3">
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
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-slate-800">
            {user?.full_name ?? user?.email ?? 'Workspace'}
          </p>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 lg:px-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white lg:hidden">
        {EMPLOYEE_NAV.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
                active ? 'text-indigo-600' : 'text-slate-500',
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
              pathname.startsWith('/hr') ? 'text-indigo-600' : 'text-slate-500',
            )}
          >
            <Grid3X3 className="h-5 w-5" />
            HR
          </Link>
        )}
      </nav>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
