import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FileSpreadsheet, CheckCircle2, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Select } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { runsInMonth, runsInYear, sumRuns, ircDueDate, departmentBreakdown } from '@/lib/reports';
import { exportIRCMonthly, exportGroupTaxCert, exportLedger, exportDepartmentCost } from '@/lib/export/excel';
import { formatPGK, formatPGKShort, formatDate, cn, daysUntil } from '@/lib/utils';

type Tab = 'swt' | 'group' | 'ledger' | 'dept';
const TABS: { id: Tab; label: string }[] = [
  { id: 'swt', label: 'Monthly SWT Remittance' },
  { id: 'group', label: 'Group Tax Certificate' },
  { id: 'ledger', label: 'Payroll Ledger' },
  { id: 'dept', label: 'Department Cost' },
];

const DEPT_COLORS = ['#8B0000', '#C9A84C', '#A50000', '#2563EB', '#16A34A', '#D97706', '#7C3AED'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Reports() {
  const [tab, setTab] = useState<Tab>('swt');
  const runs = usePayrollStore((s) => s.runs);
  const employees = useEmployeeStore((s) => s.employees);
  const company = useSettingsStore((s) => s.settings!.company);
  const taxYear = useSettingsStore((s) => s.settings!.currentTaxYear);

  const years = useMemo(() => {
    const set = new Set(runs.map((r) => new Date(r.payDate).getFullYear()));
    set.add(Number(taxYear));
    return Array.from(set).sort((a, b) => b - a);
  }, [runs, taxYear]);

  return (
    <>
      <TopBar title="IRC Reports" subtitle="Compliance reporting & exports for the Internal Revenue Commission" />
      <PageBody>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-[6px] px-3.5 py-2 text-[13px] font-medium',
                tab === t.id ? 'bg-brand text-white' : 'border border-line text-muted hover:bg-card-2 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'swt' && <MonthlySWT runs={runs} years={years} company={company} />}
        {tab === 'group' && <GroupTax runs={runs} years={years} company={company} defaultYear={taxYear} />}
        {tab === 'ledger' && <Ledger runs={runs} />}
        {tab === 'dept' && <DeptCost employees={employees} />}
      </PageBody>
    </>
  );
}

/* ---------------------------------------------------------------- Monthly SWT */

function MonthlySWT({ runs, years, company }: { runs: import('@/types').PayrollRun[]; years: number[]; company: import('@/types').Company }) {
  const now = new Date();
  const [year, setYear] = useState(years[0] ?? now.getFullYear());
  const [month, setMonth] = useState(0);
  const [lodged, setLodged] = useState<string | null>(null);

  const monthRuns = useMemo(() => runsInMonth(runs, Number(year), month), [runs, year, month]);
  const totals = sumRuns(monthRuns);
  const due = ircDueDate(Number(year), month);
  const days = daysUntil(due);
  const monthLabel = `${MONTHS[month]} ${year}`;

  const byEmp = useMemo(() => {
    const map = new Map<string, { name: string; num: string; taxable: number; swt: number }>();
    for (const run of monthRuns) {
      for (const li of run.lineItems) {
        const cur = map.get(li.employeeId) ?? { name: li.employeeName, num: li.employeeNumber, taxable: 0, swt: 0 };
        cur.taxable += li.taxableIncome;
        cur.swt += li.swtDeduction;
        map.set(li.employeeId, cur);
      }
    }
    return Array.from(map.values());
  }, [monthRuns]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setLodged(null); }} className="w-auto">
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </Select>
          <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setLodged(null); }} className="w-auto">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <Button variant="outline" icon={<FileSpreadsheet size={15} />} disabled={monthRuns.length === 0} onClick={() => exportIRCMonthly(monthRuns, monthLabel, company)}>
          Export to Excel
        </Button>
      </div>

      {monthRuns.length === 0 ? (
        <EmptyState title="No payroll in this period" message={`No completed runs found for ${monthLabel}.`} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
            <div className="bg-card p-4">
              <div className="text-[11px] uppercase tracking-wide text-faint">Total SWT Payable</div>
              <div className="tnum mt-1 text-2xl font-semibold text-brand-light">{formatPGK(totals.swt)}</div>
            </div>
            <div className="bg-card p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-faint">
                <CalendarClock size={12} /> Due Date
              </div>
              <div className="mt-1 text-lg font-semibold text-ink">{formatDate(due)}</div>
              <div className={cn('text-[12px]', days < 0 ? 'text-danger' : 'text-muted')}>
                {days < 0 ? `${Math.abs(days)} days overdue` : `in ${days} days`}
              </div>
            </div>
            <div className="flex items-center justify-between bg-card p-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-faint">Lodgement</div>
                {lodged ? (
                  <Badge tone="success" dot className="mt-1.5">Lodged {formatDate(lodged)}</Badge>
                ) : (
                  <div className="mt-1 text-[12px] text-muted">Not yet lodged</div>
                )}
              </div>
              {!lodged && (
                <Button size="sm" icon={<CheckCircle2 size={14} />} onClick={() => { setLodged(new Date().toISOString()); toast.success('Marked as lodged'); }}>
                  Mark Lodged
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-y border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-2.5 font-medium">Employee #</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 text-right font-medium">Taxable Income</th>
                  <th className="px-4 py-2.5 text-right font-medium">SWT Withheld</th>
                </tr>
              </thead>
              <tbody>
                {byEmp.map((e) => (
                  <tr key={e.num} className="border-b border-line/60">
                    <td className="px-4 py-2 font-mono text-[12px] text-muted">{e.num}</td>
                    <td className="px-4 py-2 text-ink">{e.name}</td>
                    <td className="tnum px-4 py-2 text-right text-muted">{formatPGK(e.taxable)}</td>
                    <td className="tnum px-4 py-2 text-right text-ink">{formatPGK(e.swt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="tnum bg-brand/15 font-semibold">
                  <td className="px-4 py-2.5" colSpan={2}>Total — {byEmp.length} employees</td>
                  <td className="px-4 py-2.5 text-right text-muted">{formatPGK(totals.gross)}</td>
                  <td className="px-4 py-2.5 text-right text-ink">{formatPGK(totals.swt)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

/* --------------------------------------------------------------- Group Tax */

function GroupTax({ runs, years, company, defaultYear }: { runs: import('@/types').PayrollRun[]; years: number[]; company: import('@/types').Company; defaultYear: string }) {
  const [year, setYear] = useState(Number(defaultYear));
  const yearRuns = useMemo(() => runsInYear(runs, Number(year)), [runs, year]);

  const byEmp = useMemo(() => {
    const map = new Map<string, { name: string; num: string; gross: number; swt: number; ee: number; er: number }>();
    for (const run of yearRuns) {
      for (const li of run.lineItems) {
        const cur = map.get(li.employeeId) ?? { name: li.employeeName, num: li.employeeNumber, gross: 0, swt: 0, ee: 0, er: 0 };
        cur.gross += li.totalEarnings;
        cur.swt += li.swtDeduction;
        cur.ee += li.employeeSuperDeduction;
        cur.er += li.employerSuperContribution;
        map.set(li.employeeId, cur);
      }
    }
    return Array.from(map.values());
  }, [yearRuns]);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-auto">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Button variant="outline" icon={<FileSpreadsheet size={15} />} disabled={byEmp.length === 0} onClick={() => exportGroupTaxCert(String(year), yearRuns, company)}>
          Export to Excel
        </Button>
      </div>
      {byEmp.length === 0 ? (
        <EmptyState title="No data for this year" message={`No completed payroll runs in ${year}.`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                <th className="px-4 py-2.5 font-medium">Employee #</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 text-right font-medium">Annual Gross</th>
                <th className="px-4 py-2.5 text-right font-medium">SWT Withheld</th>
                <th className="px-4 py-2.5 text-right font-medium">EE Super</th>
                <th className="px-4 py-2.5 text-right font-medium">ER Super</th>
              </tr>
            </thead>
            <tbody>
              {byEmp.map((e) => (
                <tr key={e.num} className="border-b border-line/60">
                  <td className="px-4 py-2 font-mono text-[12px] text-muted">{e.num}</td>
                  <td className="px-4 py-2 text-ink">{e.name}</td>
                  <td className="tnum px-4 py-2 text-right text-ink">{formatPGK(e.gross)}</td>
                  <td className="tnum px-4 py-2 text-right text-danger">{formatPGK(e.swt)}</td>
                  <td className="tnum px-4 py-2 text-right text-muted">{formatPGK(e.ee)}</td>
                  <td className="tnum px-4 py-2 text-right text-muted">{formatPGK(e.er)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------- Ledger */

function Ledger({ runs }: { runs: import('@/types').PayrollRun[] }) {
  const flat = useMemo(
    () =>
      runs
        .flatMap((r) => r.lineItems.map((li) => ({ ...li, runNumber: r.runNumber, payDate: r.payDate })))
        .sort((a, b) => b.payDate.localeCompare(a.payDate)),
    [runs],
  );

  return (
    <Card>
      <CardHeader
        title={`Payroll Ledger — ${flat.length} entries`}
        action={
          <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} />} disabled={flat.length === 0} onClick={() => exportLedger(flat)}>
            Export to Excel
          </Button>
        }
      />
      {flat.length === 0 ? (
        <EmptyState title="No ledger entries" message="Process payroll to build the audit ledger." />
      ) : (
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-line text-right text-[11px] uppercase tracking-wide text-faint">
                <th className="px-3 py-2.5 text-left font-medium">Run</th>
                <th className="px-3 py-2.5 text-left font-medium">Employee</th>
                <th className="px-3 py-2.5 font-medium">Gross</th>
                <th className="px-3 py-2.5 font-medium">Taxable</th>
                <th className="px-3 py-2.5 font-medium">SWT</th>
                <th className="px-3 py-2.5 font-medium">Net</th>
                <th className="px-3 py-2.5 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="tnum text-right">
              {flat.map((li, i) => (
                <tr key={`${li.runNumber}-${li.employeeId}-${i}`} className="border-b border-line/60">
                  <td className="px-3 py-2 text-left text-muted">{li.runNumber}</td>
                  <td className="px-3 py-2 text-left text-ink">{li.employeeName}</td>
                  <td className="px-3 py-2 text-muted">{formatPGK(li.grossSalary)}</td>
                  <td className="px-3 py-2 text-muted">{formatPGK(li.taxableIncome)}</td>
                  <td className="px-3 py-2 text-danger">{formatPGK(li.swtDeduction)}</td>
                  <td className="px-3 py-2 text-gold">{formatPGK(li.netPay)}</td>
                  <td className="px-3 py-2 text-ink">{formatPGK(li.totalCostToCompany)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------- Dept cost */

function DeptCost({ employees }: { employees: import('@/types').Employee[] }) {
  const data = useMemo(() => {
    const rows = departmentBreakdown(employees);
    const erRate = 8.4;
    return rows.map((r) => ({ ...r, cost: Math.round(r.gross * (1 + erRate / 100) * 100) / 100 }));
  }, [employees]);

  return (
    <Card>
      <CardHeader
        title="Department Cost (per fortnight)"
        action={
          <Button variant="outline" size="sm" icon={<FileSpreadsheet size={14} />} disabled={data.length === 0} onClick={() => exportDepartmentCost(data)}>
            Export to Excel
          </Button>
        }
      />
      {data.length === 0 ? (
        <EmptyState title="No active employees" message="Add employees to see department costs." />
      ) : (
        <>
          <div className="h-[280px] w-full px-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 12, bottom: 6, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3D1515" vertical={false} />
                <XAxis dataKey="dept" tick={{ fill: '#B89898', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#3D1515' }} />
                <YAxis tickFormatter={(v) => formatPGKShort(v)} tick={{ fill: '#B89898', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#3D1515' }} width={56} />
                <Tooltip
                  cursor={{ fill: 'rgba(139,0,0,0.08)' }}
                  contentStyle={{ background: '#1C0A0A', border: '1px solid #3D1515', borderRadius: 6, fontSize: 12 }}
                  formatter={(v) => [formatPGK(Number(v)), 'Cost']}
                />
                <Bar dataKey="cost" radius={[3, 3, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 text-right font-medium">Employees</th>
                  <th className="px-4 py-2.5 text-right font-medium">Gross / fn</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total Cost / fn</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.dept} className="border-b border-line/60">
                    <td className="px-4 py-2 text-ink">{d.dept}</td>
                    <td className="tnum px-4 py-2 text-right text-muted">{d.employees}</td>
                    <td className="tnum px-4 py-2 text-right text-muted">{formatPGK(d.gross)}</td>
                    <td className="tnum px-4 py-2 text-right text-ink">{formatPGK(d.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
