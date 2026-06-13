import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wallet,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card, CardHeader, StatCard } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PayrollChart } from '@/components/dashboard/PayrollChart';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isMissingTFN } from '@/lib/payroll';
import { ircDueDate, runsInMonth, runsInYear, sumRuns } from '@/lib/reports';
import { formatPGK, formatPGKShort, formatDate, formatFortnight, daysUntil } from '@/lib/utils';

const STATUS_TONE = {
  completed: 'success',
  draft: 'warning',
  processing: 'info',
  cancelled: 'danger',
} as const;

export function Dashboard() {
  const navigate = useNavigate();
  const employees = useEmployeeStore((s) => s.employees);
  const runs = usePayrollStore((s) => s.runs);
  const settings = useSettingsStore((s) => s.settings);
  const taxYear = Number(settings?.currentTaxYear ?? new Date().getFullYear());

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active');
    const now = new Date();
    const newThisMonth = employees.filter((e) => {
      const d = new Date(e.startDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;

    const completed = [...runs]
      .filter((r) => r.status === 'completed')
      .sort((a, b) => b.payDate.localeCompare(a.payDate));
    const lastRun = completed[0];

    const ytd = sumRuns(runsInYear(runs, taxYear));
    const lyYtd = sumRuns(runsInYear(runs, taxYear - 1));

    // IRC due for the latest month that has completed runs
    let ircAmount = 0;
    let ircDue: Date | null = null;
    if (lastRun) {
      const d = new Date(lastRun.payDate);
      const monthRuns = runsInMonth(runs, d.getFullYear(), d.getMonth());
      ircAmount = sumRuns(monthRuns).swt;
      ircDue = ircDueDate(d.getFullYear(), d.getMonth());
    }

    const missingTfn = active.filter((e) => isMissingTFN(e)).length;

    return { active, newThisMonth, lastRun, ytd, lyYtd, ircAmount, ircDue, missingTfn, completed };
  }, [employees, runs, taxYear]);

  const recent = stats.completed.slice(0, 5);
  const ircDays = stats.ircDue ? daysUntil(stats.ircDue) : null;

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={`${settings?.company.name ?? ''} • Tax year ${settings?.currentTaxYear ?? ''}`}
        actions={
          <Button icon={<TrendingUp size={15} />} onClick={() => navigate('/payroll/new')}>
            Run Payroll
          </Button>
        }
      />
      <PageBody>
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Staff"
            value={stats.active.length}
            sub={stats.newThisMonth > 0 ? `+${stats.newThisMonth} this month` : 'No new hires this month'}
            icon={<Users size={16} />}
            tone="brand"
          />
          <StatCard
            label="Last Payroll"
            value={stats.lastRun ? formatPGK(stats.lastRun.totalGross) : '—'}
            sub={stats.lastRun ? `${stats.lastRun.runNumber} • ${stats.lastRun.employeeCount} staff` : 'No runs yet'}
            icon={<Wallet size={16} />}
            tone="gold"
          />
          <StatCard
            label="Next IRC Due"
            value={
              ircDays === null ? '—' : ircDays < 0 ? `${Math.abs(ircDays)}d overdue` : `${ircDays} days`
            }
            sub={
              stats.ircDue
                ? `SWT ${formatPGKShort(stats.ircAmount)} • ${formatDate(stats.ircDue)}`
                : 'SWT remittance'
            }
            icon={<CalendarClock size={16} />}
            tone={ircDays !== null && ircDays < 0 ? 'brand' : 'info'}
          />
          <StatCard
            label="YTD Payroll"
            value={formatPGKShort(stats.ytd.gross)}
            sub={stats.lyYtd.gross > 0 ? `vs ${formatPGKShort(stats.lyYtd.gross)} LY` : `${taxYear} gross`}
            icon={<TrendingUp size={16} />}
            tone="success"
          />
        </div>

        {/* Chart */}
        <Card className="mt-4">
          <CardHeader
            title="Payroll Trend"
            action={
              <span className="flex items-center gap-4 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Gross
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Net pay
                </span>
              </span>
            }
          />
          <PayrollChart runs={runs} />
        </Card>

        {/* Two-column row */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Recent runs (60%) */}
          <Card className="lg:col-span-3">
            <CardHeader
              title="Recent Payroll Runs"
              action={
                <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />} onClick={() => navigate('/payroll')}>
                  View all
                </Button>
              }
            />
            {recent.length === 0 ? (
              <EmptyState title="No payroll runs yet" message="Process your first payroll to populate this list." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                      <th className="px-4 py-2 font-medium">Run #</th>
                      <th className="px-4 py-2 font-medium">Period</th>
                      <th className="px-4 py-2 text-right font-medium">Staff</th>
                      <th className="px-4 py-2 text-right font-medium">Gross</th>
                      <th className="px-4 py-2 text-right font-medium">Net</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/payroll/${r.id}`)}
                        className="cursor-pointer border-b border-line/60 hover:bg-card-2"
                      >
                        <td className="px-4 py-2.5 font-medium text-ink">{r.runNumber}</td>
                        <td className="px-4 py-2.5 text-muted">{formatFortnight(r.periodStart, r.periodEnd)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-muted">{r.employeeCount}</td>
                        <td className="tnum px-4 py-2.5 text-right text-ink">{formatPGK(r.totalGross)}</td>
                        <td className="tnum px-4 py-2.5 text-right text-gold">{formatPGK(r.totalNetPay)}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={STATUS_TONE[r.status]} className="capitalize">
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Compliance alerts (40%) */}
          <Card className="lg:col-span-2">
            <CardHeader title="Compliance Alerts" />
            <div className="space-y-3 p-4">
              <AlertRow
                tone={ircDays !== null && ircDays < 0 ? 'danger' : 'warning'}
                icon={<AlertTriangle size={16} />}
                title="IRC SWT Remittance"
                body={
                  stats.ircDue
                    ? `${formatPGK(stats.ircAmount)} due by ${formatDate(stats.ircDue)}`
                    : 'No remittance outstanding'
                }
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                    View Report
                  </Button>
                }
              />
              <AlertRow
                tone="success"
                icon={<CheckCircle2 size={16} />}
                title="Nasfund Contributions"
                body={
                  stats.lastRun
                    ? `Lodged with ${stats.lastRun.runNumber} on ${formatDate(stats.lastRun.processedAt ?? stats.lastRun.payDate)}`
                    : 'Nothing lodged yet'
                }
              />
              <AlertRow
                tone={stats.missingTfn > 0 ? 'warning' : 'success'}
                icon={stats.missingTfn > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                title={
                  stats.missingTfn > 0
                    ? `${stats.missingTfn} employee${stats.missingTfn > 1 ? 's' : ''} — TFN missing`
                    : 'All TFNs on file'
                }
                body={
                  stats.missingTfn > 0
                    ? 'Taxed at the maximum 42% rate until a TFN is provided.'
                    : 'SWT calculated at the correct marginal rate.'
                }
                action={
                  stats.missingTfn > 0 ? (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/employees')}>
                      View Employees
                    </Button>
                  ) : undefined
                }
              />
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

function AlertRow({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: 'danger' | 'warning' | 'success';
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const toneClass = {
    danger: 'border-danger/30 bg-danger/5 text-danger',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    success: 'border-success/30 bg-success/5 text-success',
  }[tone];
  return (
    <div className={`rounded-[6px] border px-3.5 py-3 ${toneClass}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <div className="mt-0.5 text-[12px] text-muted">{body}</div>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
