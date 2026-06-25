import { cn } from '@/lib/utils';

const fieldClasses =
  'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, 'min-h-20 resize-y', className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClasses, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
    </label>
  );
}
