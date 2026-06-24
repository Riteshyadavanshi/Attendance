import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  accent,
}: {
  className?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 shadow-sm',
        accent ? 'border-indigo-200' : 'border-slate-200',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color = 'text-indigo-600',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-2 text-3xl font-extrabold', color)}>{value}</p>
    </Card>
  );
}
