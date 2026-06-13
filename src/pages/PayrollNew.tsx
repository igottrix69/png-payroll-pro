import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  CalendarRange,
  Users,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { FormField, Input, Select, Textarea } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { PayrollAdjustment, PayrollLineItem } from '@/types';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { buildLineItem, computeRunTotals, assembleRun, isMissingTFN, EMPTY_ADJUSTMENT } from '@/lib/payroll';
import { uuid, formatPGK, fortnightEnd, todayISO, cn, num } from '@/lib/utils';

const STEPS = [
  { n: 1, label: 'Pay Period', icon: CalendarRange },
  { n: 2, label: 'Select Staff', icon: Users },
  { n: 3, label: 'Review', icon: Calculator },
  { n: 4, label: 'Confirm', icon: ShieldCheck },
];

export function PayrollNew() {
  const navigate = useNavigate();
  const employees = useEmployeeStore((s) => s.employees);
  const settings = useSettingsStore((s) => s.settings)!;
  const addRun = usePayrollStore((s) => s.addRun);
  const nextRunNumber = usePayrollStore((s) => s.nextRunNumber);

  const activeEmployees = useMemo(() => employees.filter((e) => e.status === 'active'), [employees]);

  const [step, setStep] = useState(1);
  const [periodStart, setPeriodStart] = useState(todayISO());
  const [payDate, setPayDate] = useState('');
  const [notes, setNotes] = useState('');
  const periodEnd = useMemo(() => fortnightEnd(periodStart), [periodStart]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(activeEmployees.map((e) => e.id)));
  const [adjustments, setAdjustments] = useState<Record<string, PayrollAdjustment>>({});
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const selectedEmployees = activeEmployees.filter((e) => selected.has(e.id));

  const lineItems: PayrollLineItem[] = useMemo(
    () => selectedEmployees.map((e) => buildLineItem(e, settings, adjustments[e.id] ?? EMPTY_ADJUSTMENT)),
    [selectedEmployees, settings, adjustments],
  );
  const totals = useMemo(() => computeRunTotals(lineItems), [lineItems]);
  const missingTfnCount = selectedEmployees.filter((e) => isMissingTFN(e)).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function process() {
    setProcessing(true);
    const run = assembleRun(
      {
        id: uuid(),
        runNumber: nextRunNumber(settings.currentTaxYear),
        periodStart,
        periodEnd,
        payDate: payDate || periodEnd,
        status: 'completed',
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      },
      lineItems,
    );
    setTimeout(() => {
      addRun(run);
      toast.success(`${run.runNumber} processed — ${run.employeeCount} employees paid`);
      navigate(`/payroll/${run.id}`);
    }, 500);
  }

  const canNext =
    step === 1
      ? !!periodStart && !!payDate
      : step === 2
        ? selected.size > 0
        : true;

  return (
    <>
      <TopBar title="Run Payroll" subtitle="Process a new fortnightly pay run" />
      <PageBody>
        {/* Stepper */}
        <div className="mb-5 flex items-center">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold',
                      active && 'border-brand bg-brand text-white',
                      done && 'border-success bg-success/15 text-success',
                      !active && !done && 'border-line bg-card text-faint',
                    )}
                  >
                    {done ? <Check size={16} /> : <s.icon size={16} />}
                  </span>
                  <div className="hidden sm:block">
                    <div className={cn('text-[12px] font-medium', active ? 'text-ink' : 'text-muted')}>{s.label}</div>
                    <div className="text-[10px] text-faint">Step {s.n}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && <div className={cn('mx-3 h-px flex-1', done ? 'bg-success/40' : 'bg-line')} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink">Set the pay period</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Pay Period">
                <Select value="fortnightly" disabled>
                  <option value="fortnightly">Fortnightly (PNG standard)</option>
                </Select>
              </FormField>
              <div />
              <FormField label="Period Start Date" required>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </FormField>
              <FormField label="Period End Date" hint="auto +13 days">
                <Input type="date" value={periodEnd} readOnly className="opacity-70" />
              </FormField>
              <FormField label="Pay Date" required>
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </FormField>
              <div />
              <FormField label="Notes / Memo" className="sm:col-span-2">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for this run…" />
              </FormField>
            </div>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Select employees ({selected.size})</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(activeEmployees.map((e) => e.id)))}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Deselect all
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5 font-medium">Include</th>
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5 text-right font-medium">Gross</th>
                    <th className="px-4 py-2.5 font-medium">Adjustments</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((e) => {
                    const adj = adjustments[e.id];
                    const hasAdj = adj && (adj.bonus || adj.loanDeduction || adj.otherDeductions || adj.grossOverride != null);
                    return (
                      <tr key={e.id} className="border-b border-line/60 hover:bg-card-2">
                        <td className="px-4 py-2.5">
                          <button onClick={() => toggle(e.id)} className="flex items-center">
                            <span
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-[4px] border',
                                selected.has(e.id) ? 'border-brand bg-brand text-white' : 'border-line bg-card',
                              )}
                            >
                              {selected.has(e.id) && <Check size={13} />}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-ink">{e.firstName} {e.lastName}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-faint">
                            {e.position}
                            {isMissingTFN(e) && <Badge tone="warning">No TFN</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-muted">{e.department}</td>
                        <td className="tnum px-4 py-2.5 text-right text-ink">{formatPGK(e.grossFortnightlySalary)}</td>
                        <td className="px-4 py-2.5">
                          <Button
                            variant={hasAdj ? 'gold' : 'ghost'}
                            size="sm"
                            icon={<SlidersHorizontal size={13} />}
                            onClick={() => setAdjusting(e.id)}
                            disabled={!selected.has(e.id)}
                          >
                            {hasAdj ? 'Adjusted' : 'Adjust'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Review &amp; calculate</span>
              {missingTfnCount > 0 && (
                <Badge tone="warning" dot>
                  {missingTfnCount} taxed at 42% (no TFN)
                </Badge>
              )}
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
                    <th className="px-3 py-2.5 font-medium">Super ER</th>
                    <th className="px-3 py-2.5 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="tnum text-right">
                  {lineItems.map((li) => (
                    <tr key={li.employeeId} className="border-b border-line/60 hover:bg-card-2">
                      <td className="px-3 py-2 text-left">
                        <div className="font-medium text-ink">{li.employeeName}</div>
                        <div className="text-[10px] text-faint">{li.taxBracket}</div>
                      </td>
                      <td className="px-3 py-2 text-muted">{formatPGK(li.grossSalary)}</td>
                      <td className="px-3 py-2 text-muted">{formatPGK(li.totalAllowances)}</td>
                      <td className="px-3 py-2 text-muted">{formatPGK(li.taxableIncome)}</td>
                      <td className="px-3 py-2 text-danger">{formatPGK(li.swtDeduction)}</td>
                      <td className="px-3 py-2 text-danger">{formatPGK(li.employeeSuperDeduction)}</td>
                      <td className="px-3 py-2 font-medium text-gold">{formatPGK(li.netPay)}</td>
                      <td className="px-3 py-2 text-muted">{formatPGK(li.employerSuperContribution)}</td>
                      <td className="px-3 py-2 text-ink">{formatPGK(li.totalCostToCompany)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="tnum bg-brand/15 text-right font-semibold text-ink">
                    <td className="px-3 py-2.5 text-left">Totals · {totals.employeeCount}</td>
                    <td className="px-3 py-2.5">{formatPGK(totals.totalGross)}</td>
                    <td className="px-3 py-2.5">{formatPGK(totals.totalAllowances)}</td>
                    <td className="px-3 py-2.5">—</td>
                    <td className="px-3 py-2.5 text-danger">{formatPGK(totals.totalSWT)}</td>
                    <td className="px-3 py-2.5 text-danger">{formatPGK(totals.totalEmployeeSuper)}</td>
                    <td className="px-3 py-2.5 text-gold">{formatPGK(totals.totalNetPay)}</td>
                    <td className="px-3 py-2.5">{formatPGK(totals.totalEmployerSuper)}</td>
                    <td className="px-3 py-2.5">{formatPGK(totals.totalCostToCompany)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-ink">Confirm &amp; process</h3>
            <p className="mt-1 text-[13px] text-muted">
              Review the totals below. Once processed, this run is recorded and payslips become available.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryStat label="Total Gross" value={formatPGK(totals.totalGross)} />
              <SummaryStat label="Total SWT" value={formatPGK(totals.totalSWT)} tone="danger" />
              <SummaryStat label="Total Net Pay" value={formatPGK(totals.totalNetPay)} tone="gold" />
              <SummaryStat label="Cost to Company" value={formatPGK(totals.totalCostToCompany)} />
            </div>
            <div className="mt-4 rounded-[6px] border border-line bg-card-2 p-4 text-[12px] text-muted">
              <div className="flex justify-between"><span>Employees</span><span className="tnum text-ink">{totals.employeeCount}</span></div>
              <div className="mt-1 flex justify-between"><span>Employee super (deducted)</span><span className="tnum text-ink">{formatPGK(totals.totalEmployeeSuper)}</span></div>
              <div className="mt-1 flex justify-between"><span>Employer super (contributed)</span><span className="tnum text-ink">{formatPGK(totals.totalEmployerSuper)}</span></div>
            </div>
            {missingTfnCount > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-[12px] text-warning">
                <AlertTriangle size={15} />
                {missingTfnCount} employee(s) without a TFN were taxed at the maximum 42% rate.
              </div>
            )}
          </Card>
        )}

        {/* Footer nav */}
        <div className="mt-5 flex items-center justify-between">
          <Button
            variant="ghost"
            icon={<ChevronLeft size={15} />}
            onClick={() => (step === 1 ? navigate('/payroll') : setStep((s) => s - 1))}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button iconRight={<ChevronRight size={15} />} onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              {step === 2 ? 'Review' : 'Continue'}
            </Button>
          ) : (
            <Button variant="gold" icon={<Play size={15} />} onClick={() => setConfirmOpen(true)}>
              Process Payroll
            </Button>
          )}
        </div>
      </PageBody>

      {/* Adjustment modal */}
      {adjusting && (
        <AdjustModal
          employeeName={`${activeEmployees.find((e) => e.id === adjusting)?.firstName} ${activeEmployees.find((e) => e.id === adjusting)?.lastName}`}
          baseGross={activeEmployees.find((e) => e.id === adjusting)?.grossFortnightlySalary ?? 0}
          value={adjustments[adjusting] ?? EMPTY_ADJUSTMENT}
          onClose={() => setAdjusting(null)}
          onSave={(adj) => {
            setAdjustments((prev) => ({ ...prev, [adjusting]: adj }));
            setAdjusting(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); process(); }}
        loading={processing}
        title="Process this payroll run?"
        confirmLabel="Process Payroll"
        message={
          <>
            You're about to pay <strong>{totals.employeeCount} employees</strong> a total net of{' '}
            <strong>{formatPGK(totals.totalNetPay)}</strong>. This will be recorded as completed.
          </>
        }
      />
    </>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'danger' | 'gold' }) {
  return (
    <div className="rounded-[6px] border border-line bg-card-2 p-4">
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
      <div className={cn('tnum mt-1 text-xl font-semibold', tone === 'danger' ? 'text-danger' : tone === 'gold' ? 'text-gold' : 'text-ink')}>
        {value}
      </div>
    </div>
  );
}

function AdjustModal({
  employeeName,
  baseGross,
  value,
  onClose,
  onSave,
}: {
  employeeName: string;
  baseGross: number;
  value: PayrollAdjustment;
  onClose: () => void;
  onSave: (a: PayrollAdjustment) => void;
}) {
  const [bonus, setBonus] = useState(value.bonus || 0);
  const [loan, setLoan] = useState(value.loanDeduction || 0);
  const [other, setOther] = useState(value.otherDeductions || 0);
  const [override, setOverride] = useState<string>(value.grossOverride != null ? String(value.grossOverride) : '');

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Adjustments — ${employeeName}`}
      subtitle="One-off changes for this run only"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                bonus: num(bonus),
                loanDeduction: num(loan),
                otherDeductions: num(other),
                grossOverride: override.trim() === '' ? undefined : num(override),
              })
            }
          >
            Apply
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField label="One-off Bonus (K)">
          <Input type="number" min={0} step="0.01" value={bonus || ''} onChange={(e) => setBonus(num(e.target.value))} mono />
        </FormField>
        <FormField label="Gross Override (K)" hint={`base ${formatPGK(baseGross)}`}>
          <Input type="number" min={0} step="0.01" value={override} onChange={(e) => setOverride(e.target.value)} placeholder="casual / pro-rata" mono />
        </FormField>
        <FormField label="Loan / Advance (K)">
          <Input type="number" min={0} step="0.01" value={loan || ''} onChange={(e) => setLoan(num(e.target.value))} mono />
        </FormField>
        <FormField label="Other Deduction (K)">
          <Input type="number" min={0} step="0.01" value={other || ''} onChange={(e) => setOther(num(e.target.value))} mono />
        </FormField>
      </div>
    </Modal>
  );
}
