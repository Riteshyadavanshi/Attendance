import { cn } from '@/lib/utils';

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500 focus:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('mb-1 block text-sm font-medium text-slate-700', className)}>{children}</label>;
}
