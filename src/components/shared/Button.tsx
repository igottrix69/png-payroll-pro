import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-dark text-white border border-brand-dark/40',
  secondary: 'bg-brand-light/15 hover:bg-brand-light/25 text-cream border border-line',
  ghost: 'bg-transparent hover:bg-surface-hover text-muted hover:text-ink border border-transparent',
  outline: 'bg-transparent hover:bg-card-2 text-ink border border-line',
  danger: 'bg-danger hover:bg-danger/85 text-white border border-danger/40',
  gold: 'bg-gold hover:bg-gold/85 text-[#231a05] border border-gold/40 font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3.5 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] font-medium select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light/60',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}
