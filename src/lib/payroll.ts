// lib/payroll.ts — Builds payroll line items & run totals from employees.
import type { Employee, PayrollLineItem, PayrollRun, PayrollAdjustment, AppSettings } from '@/types';
import { calculateSWT, calculateSWTNoTFN, getTaxBracketLabel, effectiveTaxRate, round2 } from './tax/swt';
import { employeeSuper, employerSuper } from './tax/super';

export const EMPTY_ADJUSTMENT: PayrollAdjustment = {
  bonus: 0,
  loanDeduction: 0,
  otherDeductions: 0,
};

/** Does this employee lack a usable TFN (and is not tax-exempt)? */
export function isMissingTFN(emp: Pick<Employee, 'tfn' | 'taxExempt'>): boolean {
  return !emp.taxExempt && (!emp.tfn || emp.tfn.trim() === '');
}

/**
 * Compute a single payroll line item for an employee.
 *
 * Tax rules applied:
 *  - taxExempt employees: SWT = 0 (must hold IRC Form 10).
 *  - no TFN lodged: taxed at the maximum marginal rate (42%) on taxable income.
 *  - otherwise: standard resident SWT schedule.
 *  - Allowances are excluded from taxable income (per IRC) but included in earnings.
 *  - Nasfund: employee 6% deducted; employer 8.4% added as a company cost.
 */
export function buildLineItem(
  emp: Employee,
  settings: AppSettings,
  adjustment: PayrollAdjustment = EMPTY_ADJUSTMENT,
): PayrollLineItem {
  const baseGross = adjustment.grossOverride ?? emp.grossFortnightlySalary;
  const grossSalary = round2(Math.max(0, baseGross + (adjustment.bonus || 0)));

  const housingAllowance = emp.housingAllowance || 0;
  const vehicleAllowance = emp.vehicleAllowance || 0;
  const mealAllowance = emp.mealAllowance || 0;
  const otherAllowances = emp.otherAllowances || 0;
  const totalAllowances = round2(housingAllowance + vehicleAllowance + mealAllowance + otherAllowances);

  const totalEarnings = round2(grossSalary + totalAllowances);

  // Taxable income = gross salary only (most allowances excluded per IRC).
  const taxableIncome = grossSalary;

  let swtDeduction = 0;
  if (emp.taxExempt) {
    swtDeduction = 0;
  } else if (isMissingTFN(emp)) {
    swtDeduction = calculateSWTNoTFN(taxableIncome);
  } else {
    swtDeduction = calculateSWT(taxableIncome);
  }

  const eeRate = settings.nasfundEmployeeRate ?? 6;
  const erRate = settings.nasfundEmployerRate ?? 8.4;
  const employeeSuperDeduction = emp.nasfundMember ? employeeSuper(grossSalary, eeRate) : 0;
  const employerSuperContribution = emp.nasfundMember ? employerSuper(grossSalary, erRate) : 0;

  const loanDeduction = adjustment.loanDeduction || 0;
  const otherDeductions = adjustment.otherDeductions || 0;

  const totalDeductions = round2(swtDeduction + employeeSuperDeduction + loanDeduction + otherDeductions);
  const netPay = round2(totalEarnings - totalDeductions);
  const totalCostToCompany = round2(totalEarnings + employerSuperContribution);

  const taxBracket = emp.taxExempt
    ? 'Exempt'
    : isMissingTFN(emp)
      ? 'No TFN (42%)'
      : getTaxBracketLabel(taxableIncome);

  return {
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    employeeNumber: emp.employeeNumber,
    department: emp.department,
    grossSalary,
    housingAllowance,
    vehicleAllowance,
    mealAllowance,
    otherAllowances,
    totalAllowances,
    totalEarnings,
    taxableIncome,
    swtDeduction,
    employeeSuperDeduction,
    loanDeduction,
    otherDeductions,
    totalDeductions,
    netPay,
    employerSuperContribution,
    totalCostToCompany,
    taxBracket,
    effectiveTaxRate: effectiveTaxRate(swtDeduction, taxableIncome),
  };
}

export interface RunTotals {
  totalGross: number;
  totalAllowances: number;
  totalSWT: number;
  totalEmployeeSuper: number;
  totalEmployerSuper: number;
  totalNetPay: number;
  totalCostToCompany: number;
  employeeCount: number;
}

/** Sum a set of line items into run totals. */
export function computeRunTotals(items: PayrollLineItem[]): RunTotals {
  const t: RunTotals = {
    totalGross: 0,
    totalAllowances: 0,
    totalSWT: 0,
    totalEmployeeSuper: 0,
    totalEmployerSuper: 0,
    totalNetPay: 0,
    totalCostToCompany: 0,
    employeeCount: items.length,
  };
  for (const i of items) {
    t.totalGross += i.grossSalary;
    t.totalAllowances += i.totalAllowances;
    t.totalSWT += i.swtDeduction;
    t.totalEmployeeSuper += i.employeeSuperDeduction;
    t.totalEmployerSuper += i.employerSuperContribution;
    t.totalNetPay += i.netPay;
    t.totalCostToCompany += i.totalCostToCompany;
  }
  return {
    totalGross: round2(t.totalGross),
    totalAllowances: round2(t.totalAllowances),
    totalSWT: round2(t.totalSWT),
    totalEmployeeSuper: round2(t.totalEmployeeSuper),
    totalEmployerSuper: round2(t.totalEmployerSuper),
    totalNetPay: round2(t.totalNetPay),
    totalCostToCompany: round2(t.totalCostToCompany),
    employeeCount: t.employeeCount,
  };
}

/** Assemble a complete (unsaved) PayrollRun from line items + period meta. */
export function assembleRun(
  meta: Pick<PayrollRun, 'id' | 'runNumber' | 'periodStart' | 'periodEnd' | 'payDate' | 'status' | 'createdAt' | 'notes' | 'processedAt'>,
  items: PayrollLineItem[],
): PayrollRun {
  const totals = computeRunTotals(items);
  return {
    ...meta,
    lineItems: items,
    ...totals,
  };
}
