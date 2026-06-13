import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const base =
  'w-full rounded-[4px] bg-card-2 border border-line px-3 py-2 text-sm text-ink placeholder:text-faint ' +
  'focus:outline-none focus:border-brand-light focus:ring-2 focus:ring-brand-light/30 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-[12px] font-medium text-muted">
      {children}
      {required && <span className="text-brand-light">*</span>}
      {hint && <span className="ml-auto text-[11px] font-normal text-faint">{hint}</span>}
    </label>
  );
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <FieldLabel required={required} hint={hint}>
          {label}
        </FieldLabel>
      )}
      {children}
      {error && <span className="mt-1 text-[11px] text-danger">{error}</span>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(
  ({ className, mono, ...props }, ref) => (
    <input ref={ref} className={cn(base, mono && 'font-mono tracking-tight', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(base, 'cursor-pointer appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'min-h-[72px] resize-y', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 text-left"
    >
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'bg-brand border-brand-dark' : 'bg-card-2 border-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-ink">{label}</span>}
          {description && <span className="text-[11px] text-faint">{description}</span>}
        </span>
      )}
    </button>
  );
}
