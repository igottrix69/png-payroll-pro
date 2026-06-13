import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[4px] border border-line bg-card',
        accent && 'border-l-4 border-l-brand',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  icon,
}: {
  title: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </div>
      {action}
    </div>
  );
}

/** Dashboard KPI card. */
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'gold' | 'success' | 'info';
}) {
  const iconTone = {
    brand: 'text-brand-light bg-brand/15',
    gold: 'text-gold bg-gold/10',
    success: 'text-success bg-success/10',
    info: 'text-[#7ab0ff] bg-info/10',
  }[tone];

  return (
    <Card accent className="p-4">
      <div className="flex items-start justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className={cn('rounded-[4px] p-1.5', iconTone)}>{icon}</span>}
      </div>
      <div className="tnum mt-2 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </Card>
  );
}
