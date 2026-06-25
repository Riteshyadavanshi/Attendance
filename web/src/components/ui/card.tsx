import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground shadow-sm',
        accent ? 'border-primary/40 bg-primary/5' : 'border-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color = 'text-primary',
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('mt-2 text-3xl font-extrabold tracking-tight', color)}>{value}</p>
      </div>
      {icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </span>
      )}
    </Card>
  );
}
