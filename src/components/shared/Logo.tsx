import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Burgundy logo mark with a gold institutional icon. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('relative inline-flex items-center justify-center rounded-[8px]', className)}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #5b9bff 0%, #2f76ea 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(53,131,255,0.30)',
      }}
    >
      <Landmark size={size * 0.5} className="text-white" strokeWidth={2} />
    </span>
  );
}

export function LogoWordmark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-ink">
          PNG Payroll <span className="text-brand">Pro</span>
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          IRC-Compliant Payroll
        </div>
      </div>
    </div>
  );
}
