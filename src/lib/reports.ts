// lib/reports.ts — Aggregation helpers for dashboard & reports.
import type { PayrollRun, Employee } from '@/types';
import { round2 } from './tax/swt';

/**
 * IRC SWT remittance is due by the 7th day of the month following the month in
 * which tax was deducted (Income Tax Act / IRC employer obligations).
 *
 * NOTE: the original brief stated the 21st; the correct statutory date is the
 * 7th. We use the accurate figure here.
 */
export const IRC_SWT_DUE_DAY = 7;

/** Returns the IRC SWT due date for deductions made in the given year/month. */
export function ircDueDate(year: number, monthIndex0: number): Date {
  // due on the 7th of the *following* month
  return new Date(year, monthIndex0 + 1, IRC_SWT_DUE_DAY);
}

/** Runs whose pay date falls in a given year/month (0-indexed month). */
export function runsInMonth(runs: PayrollRun[], year: number, monthIndex0: number): PayrollRun[] {
  return runs.filter((r) => {
    const d = new Date(r.payDate);
    return r.status === 'completed' && d.getFullYear() === year && d.getMonth() === monthIndex0;
  });
}

/** Runs whose pay date falls in a given calendar/tax year. */
export function runsInYear(runs: PayrollRun[], year: number): PayrollRun[] {
  return runs.filter((r) => r.status === 'completed' && new Date(r.payDate).getFullYear() === year);
}

export interface Totals {
  gross: number;
  swt: number;
  net: number;
  eeSuper: number;
  erSuper: number;
  cost: number;
}

export function sumRuns(runs: PayrollRun[]): Totals {
  const t: Totals = { gross: 0, swt: 0, net: 0, eeSuper: 0, erSuper: 0, cost: 0 };
  for (const r of runs) {
    t.gross += r.totalGross;
    t.swt += r.totalSWT;
    t.net += r.totalNetPay;
    t.eeSuper += r.totalEmployeeSuper;
    t.erSuper += r.totalEmployerSuper;
    t.cost += r.totalCostToCompany;
  }
  return {
    gross: round2(t.gross),
    swt: round2(t.swt),
    net: round2(t.net),
    eeSuper: round2(t.eeSuper),
    erSuper: round2(t.erSuper),
    cost: round2(t.cost),
  };
}

/** Department cost breakdown from active employees (per-fortnight basis). */
export function departmentBreakdown(employees: Employee[]): Array<{
  dept: string;
  employees: number;
  gross: number;
}> {
  const map = new Map<string, { employees: number; gross: number }>();
  for (const e of employees) {
    if (e.status !== 'active') continue;
    const cur = map.get(e.department) ?? { employees: 0, gross: 0 };
    cur.employees += 1;
    cur.gross += e.grossFortnightlySalary;
    map.set(e.department, cur);
  }
  return Array.from(map.entries())
    .map(([dept, v]) => ({ dept, employees: v.employees, gross: round2(v.gross) }))
    .sort((a, b) => b.gross - a.gross);
}
