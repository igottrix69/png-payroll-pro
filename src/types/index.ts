// types/index.ts — All TypeScript interfaces for PNG Payroll Pro

export type Gender = 'male' | 'female' | 'other';
export type EmploymentType = 'permanent' | 'casual' | 'contract' | 'part-time';
export type EmployeeStatus = 'active' | 'inactive' | 'terminated';
export type PaymentMethod = 'bank' | 'cash';
export type PayPeriod = 'fortnightly' | 'weekly' | 'monthly';
export type PayrollStatus = 'draft' | 'processing' | 'completed' | 'cancelled';

export interface Employee {
  id: string; // UUID
  employeeNumber: string; // e.g. "EMP-001"
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  phone: string;
  email?: string;
  department: string;
  position: string;
  employmentType: EmploymentType;
  startDate: string; // ISO date
  endDate?: string; // For contracts
  status: EmployeeStatus;

  // Payroll
  grossFortnightlySalary: number; // PGK, fortnightly base
  paymentMethod: PaymentMethod;
  bankName?: string; // BSP, Kina Bank, ANZ, Westpac
  bankAccountNumber?: string;
  bankBSBCode?: string;

  // Tax & Super
  tfn?: string; // Tax File Number (IRC)
  taxExempt: boolean; // Some expats are exempt
  nasfundMember: boolean;
  nasfundMemberNumber?: string;

  // Allowances (fortnightly PGK)
  housingAllowance: number;
  vehicleAllowance: number;
  mealAllowance: number;
  otherAllowances: number;

  // Leave balances (days)
  annualLeaveBalance: number;
  sickLeaveBalance: number;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollLineItem {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;

  grossSalary: number;
  housingAllowance: number;
  vehicleAllowance: number;
  mealAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  totalEarnings: number; // gross + allowances

  taxableIncome: number; // gross only (most allowances excluded per IRC)
  swtDeduction: number;
  employeeSuperDeduction: number; // 6%
  loanDeduction: number; // Salary advances recovered
  otherDeductions: number;
  totalDeductions: number;

  netPay: number;
  employerSuperContribution: number; // 8.4%
  totalCostToCompany: number;

  taxBracket: string; // e.g. "35% band"
  effectiveTaxRate: number; // e.g. 18.5

  notes?: string;
}

export interface PayrollRun {
  id: string;
  runNumber: string; // e.g. "PR-2025-001"
  periodStart: string; // ISO date (fortnight start)
  periodEnd: string; // ISO date (fortnight end)
  payDate: string; // ISO date
  status: PayrollStatus;

  lineItems: PayrollLineItem[];

  // Totals
  totalGross: number;
  totalSWT: number;
  totalEmployeeSuper: number;
  totalEmployerSuper: number;
  totalAllowances: number;
  totalNetPay: number;
  totalCostToCompany: number;

  employeeCount: number;
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

export interface Company {
  name: string;
  tradingName?: string;
  ipaNumber?: string; // Investment Promotion Authority registration
  tinnNumber?: string; // Tax Identification Number
  address: string;
  city: string; // e.g. "Port Moresby"
  province: string;
  phone: string;
  email: string;
  logoBase64?: string; // Stored as base64 for PDF use
  industry: string;
  payrollOfficerName: string;
  payrollOfficerEmail: string;
}

export interface AppSettings {
  company: Company;
  currentTaxYear: string; // e.g. "2025"
  defaultPayPeriod: PayPeriod;
  nasfundEmployeeRate: number; // Default 6
  nasfundEmployerRate: number; // Default 8.4
  currency: 'PGK';
  dateFormat: 'DD/MM/YYYY';
  pinHash: string; // SHA-256 of 4-digit PIN
  lastLogin?: string;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  days: number;
  reason?: string;
  createdAt: string;
}

/** Per-run, one-off adjustments applied to a single employee in a single payroll run. */
export interface PayrollAdjustment {
  bonus: number; // one-off bonus added to gross/taxable
  loanDeduction: number; // salary advance recovery
  otherDeductions: number; // any other deduction
  grossOverride?: number; // for casuals / partial fortnights — replaces base gross
}
