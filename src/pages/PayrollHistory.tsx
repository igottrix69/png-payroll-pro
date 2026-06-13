import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ListChecks } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Select } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { usePayrollStore } from '@/store/usePayrollStore';
import { formatPGK, formatFortnight, formatDate } from '@/lib/utils';

const STATUS_TONE = { completed: 'success', draft: 'warning', processing: 'info', cancelled: 'danger' } as const;

export function PayrollHistory() {
  const navigate = useNavigate();
  const runs = usePayrollStore((s) => s.runs);
  const [year, setYear] = useState('all');
  const [status, setStatus] = useState('all');

  const years = useMemo(
    () => Array.from(new Set(runs.map((r) => new Date(r.payDate).getFullYear()))).sort((a, b) => b - a),
    [runs],
  );

  const filtered = useMemo(
    () =>
      [...runs]
        .filter((r) => (year === 'all' ? true : new Date(r.payDate).getFullYear() === Number(year)))
        .filter((r) => (status === 'all' ? true : r.status === status))
        .sort((a, b) => b.payDate.localeCompare(a.payDate)),
    [runs, year, status],
  );

  return (
    <>
      <TopBar
        title="Payroll History"
        subtitle={`${runs.length} payroll run${runs.length === 1 ? '' : 's'} recorded`}
        actions={
          <Button icon={<Plus size={15} />} onClick={() => navigate('/payroll/new')}>
            Run Payroll
          </Button>
        }
      />
      <PageBody>
        <Card className="mb-4 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-auto min-w-[130px]">
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-[140px]">
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </Card>

        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ListChecks size={32} />}
              title="No payroll runs"
              message="Run your first payroll to see it here."
              action={<Button icon={<Plus size={15} />} onClick={() => navigate('/payroll/new')}>Run Payroll</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5 font-medium">Run #</th>
                    <th className="px-4 py-2.5 font-medium">Period</th>
                    <th className="px-4 py-2.5 font-medium">Pay Date</th>
                    <th className="px-4 py-2.5 text-right font-medium">Staff</th>
                    <th className="px-4 py-2.5 text-right font-medium">Gross</th>
                    <th className="px-4 py-2.5 text-right font-medium">SWT</th>
                    <th className="px-4 py-2.5 text-right font-medium">Net Pay</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/payroll/${r.id}`)}
                      className="cursor-pointer border-b border-line/60 hover:bg-card-2"
                    >
                      <td className="px-4 py-2.5 font-medium text-ink">{r.runNumber}</td>
                      <td className="px-4 py-2.5 text-muted">{formatFortnight(r.periodStart, r.periodEnd)}</td>
                      <td className="px-4 py-2.5 text-muted">{formatDate(r.payDate)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-muted">{r.employeeCount}</td>
                      <td className="tnum px-4 py-2.5 text-right text-ink">{formatPGK(r.totalGross)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-danger">{formatPGK(r.totalSWT)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-gold">{formatPGK(r.totalNetPay)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[r.status]} className="capitalize">{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
