import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Receipt, Eye, X } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { PayslipViewer } from '@/components/payroll/PayslipViewer';
import type { PayrollRun, PayrollLineItem } from '@/types';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { downloadPayslip } from '@/lib/export/pdf';
import { formatPGK, formatFortnight, formatDate } from '@/lib/utils';

interface Row {
  run: PayrollRun;
  item: PayrollLineItem;
}

export function Payslips() {
  const [params, setParams] = useSearchParams();
  const empId = params.get('emp');
  const runs = usePayrollStore((s) => s.runs);
  const employees = useEmployeeStore((s) => s.employees);
  const company = useSettingsStore((s) => s.settings!.company);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Row | null>(null);

  const empName = empId ? employees.find((e) => e.id === empId) : null;

  const rows: Row[] = useMemo(() => {
    const all: Row[] = [];
    for (const run of runs) {
      for (const item of run.lineItems) {
        if (empId && item.employeeId !== empId) continue;
        all.push({ run, item });
      }
    }
    const q = search.trim().toLowerCase();
    return all
      .filter((r) =>
        q ? `${r.item.employeeName} ${r.item.employeeNumber} ${r.run.runNumber}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => b.run.payDate.localeCompare(a.run.payDate));
  }, [runs, empId, search]);

  return (
    <>
      <TopBar
        title="Payslips"
        subtitle={empName ? `${empName.firstName} ${empName.lastName}` : `${rows.length} payslip${rows.length === 1 ? '' : 's'} across all runs`}
      />
      <PageBody>
        <Card className="mb-4 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or run…" className="pl-9" />
            </div>
            {empName && (
              <Badge tone="brand" className="gap-2">
                {empName.firstName} {empName.lastName}
                <button onClick={() => setParams({})} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}
          </div>
        </Card>

        <Card>
          {rows.length === 0 ? (
            <EmptyState icon={<Receipt size={32} />} title="No payslips" message="Payslips appear here after you process a payroll run." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Run #</th>
                    <th className="px-4 py-2.5 font-medium">Period</th>
                    <th className="px-4 py-2.5 font-medium">Pay Date</th>
                    <th className="px-4 py-2.5 text-right font-medium">Net Pay</th>
                    <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ run, item }) => (
                    <tr key={`${run.id}-${item.employeeId}`} className="border-b border-line/60 hover:bg-card-2">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-ink">{item.employeeName}</div>
                        <div className="font-mono text-[11px] text-faint">{item.employeeNumber}</div>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{run.runNumber}</td>
                      <td className="px-4 py-2.5 text-muted">{formatFortnight(run.periodStart, run.periodEnd)}</td>
                      <td className="px-4 py-2.5 text-muted">{formatDate(run.payDate)}</td>
                      <td className="tnum px-4 py-2.5 text-right text-gold">{formatPGK(item.netPay)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button title="View" onClick={() => setViewing({ run, item })} className="rounded-[4px] p-1.5 text-muted hover:bg-surface-hover hover:text-ink">
                            <Eye size={15} />
                          </button>
                          <button title="Download PDF" onClick={() => downloadPayslip(run, item, company)} className="rounded-[4px] p-1.5 text-muted hover:bg-surface-hover hover:text-ink">
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageBody>

      {viewing && <PayslipViewer open onClose={() => setViewing(null)} run={viewing.run} item={viewing.item} />}
    </>
  );
}
