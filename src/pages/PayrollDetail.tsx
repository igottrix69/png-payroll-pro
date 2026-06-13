import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PayslipViewer } from '@/components/payroll/PayslipViewer';
import type { PayrollLineItem } from '@/types';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { downloadAllPayslips } from '@/lib/export/pdf';
import { exportLedger } from '@/lib/export/excel';
import { formatPGK, formatFortnight, formatDate, cn } from '@/lib/utils';

const STATUS_TONE = { completed: 'success', draft: 'warning', processing: 'info', cancelled: 'danger' } as const;

export function PayrollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const run = usePayrollStore((s) => s.runs.find((r) => r.id === id));
  const removeRun = usePayrollStore((s) => s.removeRun);
  const company = useSettingsStore((s) => s.settings!.company);

  const [viewing, setViewing] = useState<PayrollLineItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!run) {
    return (
      <>
        <TopBar title="Payroll Run" />
        <PageBody>
          <Card>
            <EmptyState
              title="Run not found"
              message="This payroll run may have been deleted."
              action={<Button onClick={() => navigate('/payroll')}>Back to history</Button>}
            />
          </Card>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={run.runNumber}
        subtitle={`${formatFortnight(run.periodStart, run.periodEnd)} • Paid ${formatDate(run.payDate)}`}
        actions={
          <>
            <Button variant="outline" icon={<FileSpreadsheet size={15} />} onClick={() => exportLedger(run.lineItems.map((li) => ({ ...li, runNumber: run.runNumber, payDate: run.payDate })))}>
              Excel
            </Button>
            <Button icon={<Download size={15} />} onClick={() => downloadAllPayslips(run, company)}>
              All Payslips
            </Button>
          </>
        }
      />
      <PageBody>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/payroll')} className="mb-4">
          Back to history
        </Button>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label="Status" value={<Badge tone={STATUS_TONE[run.status]} className="capitalize">{run.status}</Badge>} />
          <Stat label="Employees" value={<span className="tnum">{run.employeeCount}</span>} />
          <Stat label="Gross" value={<span className="tnum">{formatPGK(run.totalGross)}</span>} />
          <Stat label="SWT" value={<span className="tnum text-danger">{formatPGK(run.totalSWT)}</span>} />
          <Stat label="Net Pay" value={<span className="tnum text-gold">{formatPGK(run.totalNetPay)}</span>} />
          <Stat label="Cost to Co." value={<span className="tnum">{formatPGK(run.totalCostToCompany)}</span>} />
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Line items</span>
            <span className="text-[12px] text-muted">Click a row to view the payslip</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-3 py-2.5 text-left font-medium">Employee</th>
                  <th className="px-3 py-2.5 font-medium">Gross</th>
                  <th className="px-3 py-2.5 font-medium">Allow.</th>
                  <th className="px-3 py-2.5 font-medium">Taxable</th>
                  <th className="px-3 py-2.5 font-medium">SWT</th>
                  <th className="px-3 py-2.5 font-medium">Super EE</th>
                  <th className="px-3 py-2.5 font-medium">Net Pay</th>
                  <th className="px-3 py-2.5 font-medium">Cost</th>
                  <th className="px-3 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="tnum text-right">
                {run.lineItems.map((li) => (
                  <tr key={li.employeeId} className="cursor-pointer border-b border-line/60 hover:bg-card-2" onClick={() => setViewing(li)}>
                    <td className="px-3 py-2 text-left">
                      <div className="font-medium text-ink">{li.employeeName}</div>
                      <div className="text-[10px] text-faint">{li.employeeNumber} • {li.taxBracket}</div>
                    </td>
                    <td className="px-3 py-2 text-muted">{formatPGK(li.grossSalary)}</td>
                    <td className="px-3 py-2 text-muted">{formatPGK(li.totalAllowances)}</td>
                    <td className="px-3 py-2 text-muted">{formatPGK(li.taxableIncome)}</td>
                    <td className="px-3 py-2 text-danger">{formatPGK(li.swtDeduction)}</td>
                    <td className="px-3 py-2 text-danger">{formatPGK(li.employeeSuperDeduction)}</td>
                    <td className="px-3 py-2 font-medium text-gold">{formatPGK(li.netPay)}</td>
                    <td className="px-3 py-2 text-ink">{formatPGK(li.totalCostToCompany)}</td>
                    <td className="px-3 py-2 text-right">
                      <Eye size={15} className="ml-auto text-faint" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="tnum bg-brand/15 text-right font-semibold text-ink">
                  <td className="px-3 py-2.5 text-left">Totals</td>
                  <td className="px-3 py-2.5">{formatPGK(run.totalGross)}</td>
                  <td className="px-3 py-2.5">{formatPGK(run.totalAllowances)}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5 text-danger">{formatPGK(run.totalSWT)}</td>
                  <td className="px-3 py-2.5 text-danger">{formatPGK(run.totalEmployeeSuper)}</td>
                  <td className="px-3 py-2.5 text-gold">{formatPGK(run.totalNetPay)}</td>
                  <td className="px-3 py-2.5">{formatPGK(run.totalCostToCompany)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {run.notes && (
          <Card className="mt-4 p-4 text-[13px] text-muted">
            <span className="font-medium text-ink">Notes: </span>
            {run.notes}
          </Card>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} className="text-danger hover:text-danger">
            Delete run
          </Button>
        </div>
      </PageBody>

      {viewing && <PayslipViewer open onClose={() => setViewing(null)} run={run} item={viewing} />}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          removeRun(run.id);
          toast.success('Payroll run deleted');
          navigate('/payroll');
        }}
        danger
        title="Delete this payroll run?"
        confirmLabel="Delete run"
        message={`${run.runNumber} and all its payslips will be permanently removed. This cannot be undone.`}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn('rounded-[6px] border border-line bg-card p-3.5')}>
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
