import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlayCircle,
  ListChecks,
  Receipt,
  FileText,
  CalendarDays,
  Settings as SettingsIcon,
  Lock,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { LogoWordmark } from '@/components/shared/Logo';
import { Badge } from '@/components/shared/Badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLicenseStore } from '@/store/useLicenseStore';
import { TIER_META } from '@/lib/license';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  badge?: string;
  end?: boolean;
}

const sections: NavItem[][] = [
  [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/employees', label: 'Employees', icon: Users },
  ],
  [
    { to: '/payroll/new', label: 'Run Payroll', icon: PlayCircle, badge: 'NEW' },
    { to: '/payroll', label: 'Payroll History', icon: ListChecks, end: true },
    { to: '/payslips', label: 'Payslips', icon: Receipt },
  ],
  [
    { to: '/reports', label: 'IRC Reports', icon: FileText },
    { to: '/leave', label: 'Leave Management', icon: CalendarDays },
  ],
  [{ to: '/settings', label: 'Settings', icon: SettingsIcon }],
];

export function Sidebar() {
  const lock = useAuthStore((s) => s.lock);
  const company = useSettingsStore((s) => s.settings?.company);
  const license = useLicenseStore((s) => s.status);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-4 py-4">
        <LogoWordmark />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {sections.map((section, si) => (
          <div key={si}>
            {si > 0 && <div className="my-2 border-t border-line/70" />}
            {section.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-muted hover:bg-surface-hover hover:text-ink',
                  )
                }
              >
                <item.icon size={17} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge tone="gold" className="px-1.5 py-0 text-[9px]">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <div className="mb-2 px-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wide text-faint">Company</div>
            {license?.payload && (
              <Badge tone={license.isTrial ? 'warning' : 'success'} className="px-1.5 py-0 text-[9px]">
                {license.isTrial ? `Trial · ${license.daysLeft ?? 0}d` : TIER_META[license.payload.tier].label}
              </Badge>
            )}
          </div>
          <div className="truncate text-[12px] font-medium text-muted">{company?.name ?? '—'}</div>
        </div>
        <button
          onClick={lock}
          className="flex w-full items-center gap-2.5 rounded-[6px] border border-line px-3 py-2 text-[13px] font-medium text-muted hover:border-brand-light hover:bg-surface-hover hover:text-ink"
        >
          <Lock size={15} />
          Lock / Sign Out
        </button>
      </div>
    </aside>
  );
}
