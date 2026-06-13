import { useMemo, useState } from 'react';
import { CalendarPlus, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Modal } from '@/components/shared/Modal';
import { FormField, Input, Select, Textarea } from '@/components/shared/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import type { LeaveType } from '@/types';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { daysBetweenInclusive, formatDate, todayISO } from '@/lib/utils';

const HIGH_BALANCE = 30;

export function Leave() {
  const employees = useEmployeeStore((s) => s.employees);
  const adjustLeave = useEmployeeStore((s) => s.adjustLeaveBalance);
  const records = useLeaveStore((s) => s.records);
  const addRecord = useLeaveStore((s) => s.add);
  const removeRecord = useLeaveStore((s) => s.remove);
  const [open, setOpen] = useState(false);

  const active = useMemo(() => employees.filter((e) => e.status !== 'terminated'), [employees]);
  const highBalance = active.filter((e) => e.annualLeaveBalance > HIGH_BALANCE);

  return (
    <>
      <TopBar
        title="Leave Management"
        subtitle="Track annual & sick leave balances"
        actions={<Button icon={<CalendarPlus size={15} />} onClick={() => setOpen(true)} disabled={active.length === 0}>Record Leave</Button>}
      />
      <PageBody>
        {highBalance.length > 0 && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[6px] border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-ink">{highBalance.length} employee(s) over {HIGH_BALANCE} days annual leave</span>
              <span className="text-muted"> — outstanding leave liability: {highBalance.map((e) => `${e.firstName} ${e.lastName}`).join(', ')}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Balances */}
          <Card className="lg:col-span-3">
            <CardHeader title="Leave Balances" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5 text-right font-medium">Annual (days)</th>
                    <th className="px-4 py-2.5 text-right font-medium">Sick (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((e) => (
                    <tr key={e.id} className="border-b border-line/60 hover:bg-card-2">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar first={e.firstName} last={e.lastName} seed={e.department} size={28} />
                          <span className="font-medium text-ink">{e.firstName} {e.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{e.department}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`tnum ${e.annualLeaveBalance > HIGH_BALANCE ? 'font-semibold text-warning' : 'text-ink'}`}>
                          {e.annualLeaveBalance}
                        </span>
                      </td>
                      <td className="tnum px-4 py-2.5 text-right text-ink">{e.sickLeaveBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* History */}
          <Card className="lg:col-span-2">
            <CardHeader title="Leave History" />
            {records.length === 0 ? (
              <EmptyState title="No leave recorded" message="Recorded leave appears here." />
            ) : (
              <div className="max-h-[460px] divide-y divide-line overflow-auto">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <div className="text-[13px] font-medium text-ink">{r.employeeName}</div>
                      <div className="text-[11px] text-muted">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </div>
                      {r.reason && <div className="text-[11px] text-faint">{r.reason}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <Badge tone={r.leaveType === 'sick' ? 'info' : r.leaveType === 'annual' ? 'gold' : 'neutral'} className="capitalize">
                          {r.leaveType}
                        </Badge>
                        <div className="tnum mt-1 text-[12px] text-muted">{r.days} day{r.days === 1 ? '' : 's'}</div>
                      </div>
                      <button
                        title="Delete & restore balance"
                        onClick={() => {
                          if (r.leaveType === 'annual') adjustLeave(r.employeeId, 'annual', r.days);
                          if (r.leaveType === 'sick') adjustLeave(r.employeeId, 'sick', r.days);
                          removeRecord(r.id);
                          toast.success('Leave record removed');
                        }}
                        className="rounded p-1.5 text-faint hover:bg-surface-hover hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageBody>

      {open && <RecordLeaveModal onClose={() => setOpen(false)} />}
    </>
  );

  function RecordLeaveModal({ onClose }: { onClose: () => void }) {
    const [employeeId, setEmployeeId] = useState(active[0]?.id ?? '');
    const [leaveType, setLeaveType] = useState<LeaveType>('annual');
    const [startDate, setStartDate] = useState(todayISO());
    const [endDate, setEndDate] = useState(todayISO());
    const [reason, setReason] = useState('');

    const days = startDate && endDate ? daysBetweenInclusive(startDate, endDate) : 0;
    const emp = active.find((e) => e.id === employeeId);
    const balance = emp ? (leaveType === 'sick' ? emp.sickLeaveBalance : emp.annualLeaveBalance) : 0;
    const exceeds = (leaveType === 'annual' || leaveType === 'sick') && days > balance;

    function save() {
      if (!emp) return;
      if (endDate < startDate) {
        toast.error('End date must be after start date');
        return;
      }
      addRecord({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        leaveType,
        startDate,
        endDate,
        days,
        reason: reason.trim() || undefined,
      });
      if (leaveType === 'annual') adjustLeave(emp.id, 'annual', -days);
      if (leaveType === 'sick') adjustLeave(emp.id, 'sick', -days);
      toast.success(`${days} day(s) ${leaveType} leave recorded`);
      onClose();
    }

    return (
      <Modal
        open
        onClose={onClose}
        size="sm"
        title="Record Leave"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={!emp || days <= 0}>Record</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Employee" className="col-span-2">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {active.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Leave Type" className="col-span-2">
            <Select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="Start Date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
          <FormField label="Reason / Notes" className="col-span-2">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[6px] border border-line bg-card-2 px-3 py-2 text-[12px]">
          <span className="text-muted">Duration</span>
          <span className="tnum font-semibold text-ink">{days} day{days === 1 ? '' : 's'}</span>
        </div>
        {exceeds && (
          <div className="mt-2 flex items-center gap-2 rounded-[6px] border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
            <AlertTriangle size={13} />
            Exceeds available balance ({balance} days) — balance will go to 0.
          </div>
        )}
      </Modal>
    );
  }
}
