import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { isMissingTFN } from '@/lib/payroll';
import { Badge } from '@/components/shared/Badge';

export function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const officer = useSettingsStore((s) => s.settings?.company.payrollOfficerName);
  const employees = useEmployeeStore((s) => s.employees);
  const alerts = employees.filter((e) => e.status === 'active' && isMissingTFN(e)).length;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-bg/80 px-6 py-3.5 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-[12px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="relative">
          <button className="rounded-[6px] border border-line p-2 text-muted hover:bg-card-2 hover:text-ink">
            <Bell size={17} />
          </button>
          {alerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
              {alerts}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <div className="text-right leading-tight">
            <div className="text-[12px] font-medium text-ink">{officer ?? 'Payroll Officer'}</div>
            <Badge tone="success" dot className="mt-0.5 px-1.5 py-0 text-[9px]">
              Signed in
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
