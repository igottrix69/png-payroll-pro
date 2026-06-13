import { Download } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { LogoMark } from '@/components/shared/Logo';
import type { PayrollRun, PayrollLineItem } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { downloadPayslip } from '@/lib/export/pdf';
import { formatPGK, formatFortnight, formatDate } from '@/lib/utils';

export function PayslipViewer({
  open,
  onClose,
  run,
  item,
}: {
  open: boolean;
  onClose: () => void;
  run: PayrollRun;
  item: PayrollLineItem;
}) {
  const company = useSettingsStore((s) => s.settings!.company);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button icon={<Download size={15} />} onClick={() => downloadPayslip(run, item, company)}>
            Download PDF
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-[6px] border border-line">
        {/* Header band */}
        <div className="flex items-center justify-between bg-brand px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div>
              <div className="text-sm font-semibold">{company.name}</div>
              <div className="text-[11px] text-white/70">{company.tradingName ?? 'PNG Payroll Pro'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gold">PAYSLIP</div>
            <div className="text-[11px] text-white/80">{run.runNumber}</div>
            <div className="text-[11px] text-white/80">{formatFortnight(run.periodStart, run.periodEnd)}</div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Employee details */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Detail label="Name" value={item.employeeName} />
            <Detail label="Employee #" value={item.employeeNumber} mono />
            <Detail label="Department" value={item.department} />
            <Detail label="Pay Date" value={formatDate(run.payDate)} />
          </div>

          {/* Earnings / Deductions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LineTable
              title="Earnings"
              rows={[
                ['Base Salary', item.grossSalary],
                ...(item.housingAllowance ? [['Housing Allowance', item.housingAllowance] as [string, number]] : []),
                ...(item.vehicleAllowance ? [['Vehicle Allowance', item.vehicleAllowance] as [string, number]] : []),
                ...(item.mealAllowance ? [['Meal Allowance', item.mealAllowance] as [string, number]] : []),
                ...(item.otherAllowances ? [['Other Allowances', item.otherAllowances] as [string, number]] : []),
              ]}
              total={['Total Earnings', item.totalEarnings]}
            />
            <LineTable
              title="Deductions"
              rows={[
                ['SWT (Income Tax)', item.swtDeduction],
                ...(item.employeeSuperDeduction ? [['Nasfund (Employee)', item.employeeSuperDeduction] as [string, number]] : []),
                ...(item.loanDeduction ? [['Loan / Advance', item.loanDeduction] as [string, number]] : []),
                ...(item.otherDeductions ? [['Other Deductions', item.otherDeductions] as [string, number]] : []),
              ]}
              total={['Total Deductions', item.totalDeductions]}
              tone="danger"
            />
          </div>

          {/* Net pay */}
          <div className="flex items-center justify-between rounded-[6px] bg-brand px-5 py-3.5 text-white">
            <span className="text-sm font-semibold">NET PAY</span>
            <span className="tnum text-xl font-semibold text-gold">{formatPGK(item.netPay)}</span>
          </div>

          {/* Employer info */}
          <div className="rounded-[6px] border border-line bg-card-2 px-4 py-3 text-[12px] text-muted">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Employer Contribution (not deducted)
            </div>
            <div className="flex justify-between"><span>Nasfund Employer (8.4%)</span><span className="tnum text-ink">{formatPGK(item.employerSuperContribution)}</span></div>
            <div className="mt-1 flex justify-between"><span>Total Cost to Employer</span><span className="tnum text-ink">{formatPGK(item.totalCostToCompany)}</span></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-faint">
            <div className="flex items-center gap-2">
              <Badge tone="gold">{item.taxBracket}</Badge>
              <span>Effective rate {item.effectiveTaxRate.toFixed(2)}%</span>
            </div>
            <span>IRC SWT per 2024/2025 fortnightly schedule</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-faint">{label}</div>
      <div className={`text-[13px] text-ink ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function LineTable({
  title,
  rows,
  total,
  tone,
}: {
  title: string;
  rows: [string, number][];
  total: [string, number];
  tone?: 'danger';
}) {
  return (
    <div className="overflow-hidden rounded-[6px] border border-line">
      <div className="bg-brand/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-cream">{title}</div>
      <div className="divide-y divide-line">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between px-3 py-1.5 text-[12px]">
            <span className="text-muted">{label}</span>
            <span className={`tnum ${tone === 'danger' ? 'text-danger' : 'text-ink'}`}>{formatPGK(val)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-line bg-card-2 px-3 py-2 text-[12px] font-semibold">
        <span className="text-ink">{total[0]}</span>
        <span className="tnum text-ink">{formatPGK(total[1])}</span>
      </div>
    </div>
  );
}
