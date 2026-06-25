import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-muted text-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-[var(--success)]/12 text-[var(--success)]',
  warning: 'bg-[var(--warning)]/12 text-[var(--warning)]',
  danger: 'bg-destructive/12 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({
  tone = 'default',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
