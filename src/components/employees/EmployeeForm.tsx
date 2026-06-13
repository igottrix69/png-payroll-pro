import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';
import { FormField, Input, Select, Toggle } from '@/components/shared/Input';
import type { Employee } from '@/types';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { buildLineItem, isMissingTFN } from '@/lib/payroll';
import { formatPGK, num } from '@/lib/utils';

const BANKS = ['BSP', 'Kina Bank', 'ANZ', 'Westpac PNG', 'MiBank'];
const DEPARTMENTS = ['Operations', 'Administration', 'Engineering', 'Finance', 'Human Resources', 'Sales', 'Management'];

type Draft = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

function blankDraft(employeeNumber: string): Draft {
  return {
    employeeNumber,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    email: '',
    department: DEPARTMENTS[0],
    position: '',
    employmentType: 'permanent',
    startDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    grossFortnightlySalary: 0,
    paymentMethod: 'bank',
    bankName: 'BSP',
    bankAccountNumber: '',
    bankBSBCode: '',
    tfn: '',
    taxExempt: false,
    nasfundMember: true,
    nasfundMemberNumber: '',
    housingAllowance: 0,
    vehicleAllowance: 0,
    mealAllowance: 0,
    otherAllowances: 0,
    annualLeaveBalance: 0,
    sickLeaveBalance: 0,
    notes: '',
  };
}

export function EmployeeForm({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Employee | null;
}) {
  const add = useEmployeeStore((s) => s.add);
  const update = useEmployeeStore((s) => s.update);
  const nextNumber = useEmployeeStore((s) => s.nextEmployeeNumber);
  const settings = useSettingsStore((s) => s.settings)!;

  const [form, setForm] = useState<Draft>(() =>
    editing ? { ...editing } : blankDraft(nextNumber()),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Live payslip preview
  const preview = useMemo(() => {
    const emp: Employee = { ...form, id: 'preview', createdAt: '', updatedAt: '' };
    return buildLineItem(emp, settings);
  }, [form, settings]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.position.trim()) e.position = 'Required';
    if (!form.employeeNumber.trim()) e.employeeNumber = 'Required';
    if (!form.startDate) e.startDate = 'Required';
    if (form.grossFortnightlySalary <= 0) e.grossFortnightlySalary = 'Must be greater than 0';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.paymentMethod === 'bank' && !form.bankAccountNumber?.trim())
      e.bankAccountNumber = 'Account number required for bank payment';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    const clean: Draft = {
      ...form,
      email: form.email?.trim() || undefined,
      tfn: form.tfn?.trim() || undefined,
    };
    if (editing) {
      update(editing.id, clean);
      toast.success('Employee updated');
    } else {
      add(clean);
      toast.success('Employee added');
    }
    onClose();
  }

  const tfnWarn = isMissingTFN({ tfn: form.tfn, taxExempt: form.taxExempt });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={editing ? `Edit ${editing.firstName} ${editing.lastName}` : 'Add Employee'}
      subtitle="All payroll & tax fields are calculated live in the preview below"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? 'Save Changes' : 'Add Employee'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Section 1 — Personal */}
          <Section title="Personal Details">
            <FormField label="First Name" required error={errors.firstName}>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </FormField>
            <FormField label="Date of Birth">
              <Input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            </FormField>
            <FormField label="Gender">
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value as Draft['gender'])}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+675 ..." />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <Input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </FormField>
          </Section>

          {/* Section 2 — Employment */}
          <Section title="Employment">
            <FormField label="Employee Number" required error={errors.employeeNumber}>
              <Input value={form.employeeNumber} onChange={(e) => set('employeeNumber', e.target.value)} mono />
            </FormField>
            <FormField label="Department">
              <Select value={form.department} onChange={(e) => set('department', e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Position" required error={errors.position}>
              <Input value={form.position} onChange={(e) => set('position', e.target.value)} />
            </FormField>
            <FormField label="Employment Type">
              <Select
                value={form.employmentType}
                onChange={(e) => set('employmentType', e.target.value as Draft['employmentType'])}
              >
                <option value="permanent">Permanent</option>
                <option value="casual">Casual</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </Select>
            </FormField>
            <FormField label="Start Date" required error={errors.startDate}>
              <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </FormField>
            <FormField label="End Date" hint="contracts only">
              <Input type="date" value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => set('status', e.target.value as Draft['status'])}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </Select>
            </FormField>
          </Section>

          {/* Section 3 — Payroll */}
          <Section title="Payroll">
            <FormField label="Gross Fortnightly Salary (K)" required error={errors.grossFortnightlySalary}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.grossFortnightlySalary || ''}
                onChange={(e) => set('grossFortnightlySalary', num(e.target.value))}
                mono
              />
            </FormField>
            <FormField label="Payment Method">
              <Select
                value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value as Draft['paymentMethod'])}
              >
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
              </Select>
            </FormField>
            {form.paymentMethod === 'bank' && (
              <>
                <FormField label="Bank">
                  <Select value={form.bankName ?? BANKS[0]} onChange={(e) => set('bankName', e.target.value)}>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Account Number" error={errors.bankAccountNumber}>
                  <Input
                    value={form.bankAccountNumber ?? ''}
                    onChange={(e) => set('bankAccountNumber', e.target.value)}
                    mono
                  />
                </FormField>
                <FormField label="BSB Code">
                  <Input value={form.bankBSBCode ?? ''} onChange={(e) => set('bankBSBCode', e.target.value)} mono />
                </FormField>
              </>
            )}
          </Section>

          {/* Section 4 — Allowances */}
          <Section title="Allowances (Fortnightly K)">
            <FormField label="Housing">
              <Input type="number" min={0} step="0.01" value={form.housingAllowance || ''} onChange={(e) => set('housingAllowance', num(e.target.value))} mono />
            </FormField>
            <FormField label="Vehicle">
              <Input type="number" min={0} step="0.01" value={form.vehicleAllowance || ''} onChange={(e) => set('vehicleAllowance', num(e.target.value))} mono />
            </FormField>
            <FormField label="Meal">
              <Input type="number" min={0} step="0.01" value={form.mealAllowance || ''} onChange={(e) => set('mealAllowance', num(e.target.value))} mono />
            </FormField>
            <FormField label="Other">
              <Input type="number" min={0} step="0.01" value={form.otherAllowances || ''} onChange={(e) => set('otherAllowances', num(e.target.value))} mono />
            </FormField>
          </Section>

          {/* Section 5 — Tax & Super */}
          <Section title="Tax & Super">
            <FormField label="Tax File Number (TFN)" className="sm:col-span-2">
              <Input value={form.tfn ?? ''} onChange={(e) => set('tfn', e.target.value)} mono placeholder="e.g. 123-456-789" />
            </FormField>
            <FormField label="Nasfund Member Number">
              <Input value={form.nasfundMemberNumber ?? ''} onChange={(e) => set('nasfundMemberNumber', e.target.value)} mono />
            </FormField>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <Toggle checked={form.nasfundMember} onChange={(v) => set('nasfundMember', v)} label="Nasfund Member" />
              <Toggle
                checked={form.taxExempt}
                onChange={(v) => set('taxExempt', v)}
                label="Tax Exempt"
                description="Must hold IRC Form 10"
              />
            </div>
          </Section>

          {/* Section 6 — Leave */}
          <Section title="Leave Balances (days)">
            <FormField label="Annual Leave">
              <Input type="number" min={0} value={form.annualLeaveBalance || ''} onChange={(e) => set('annualLeaveBalance', num(e.target.value))} mono />
            </FormField>
            <FormField label="Sick Leave">
              <Input type="number" min={0} value={form.sickLeaveBalance || ''} onChange={(e) => set('sickLeaveBalance', num(e.target.value))} mono />
            </FormField>
          </Section>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-0 rounded-[8px] border border-line bg-card-2 p-4">
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-gold">Live Payslip Preview</div>
            {tfnWarn && (
              <div className="mb-3 flex items-start gap-2 rounded-[6px] border border-warning/30 bg-warning/10 px-2.5 py-2 text-[11px] text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                No TFN — taxed at maximum 42% rate
              </div>
            )}
            <PreviewRow label="Gross Salary" value={formatPGK(preview.grossSalary)} />
            <PreviewRow label="Allowances" value={formatPGK(preview.totalAllowances)} />
            <PreviewRow label="Total Earnings" value={formatPGK(preview.totalEarnings)} strong />
            <div className="my-2 border-t border-line" />
            <PreviewRow label={`SWT (${preview.taxBracket})`} value={`- ${formatPGK(preview.swtDeduction)}`} tone="danger" />
            <PreviewRow label="Nasfund (Employee)" value={`- ${formatPGK(preview.employeeSuperDeduction)}`} tone="danger" />
            <div className="my-2 border-t border-line" />
            <div className="rounded-[6px] bg-brand/15 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-muted">Net Pay</span>
                <span className="tnum text-lg font-semibold text-gold">{formatPGK(preview.netPay)}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-faint">
              <div className="flex justify-between">
                <span>Employer Super (8.4%)</span>
                <span className="tnum">{formatPGK(preview.employerSuperContribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost to company</span>
                <span className="tnum">{formatPGK(preview.totalCostToCompany)}</span>
              </div>
              <div className="flex justify-between">
                <span>Effective tax rate</span>
                <span className="tnum">{preview.effectiveTaxRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-brand-light">{title}</h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'danger';
}) {
  return (
    <div className="flex items-center justify-between py-0.5 text-[12px]">
      <span className="text-muted">{label}</span>
      <span
        className={`tnum ${strong ? 'font-semibold text-ink' : tone === 'danger' ? 'text-danger' : 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  );
}
