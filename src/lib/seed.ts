// lib/seed.ts — First-run sample data (Highlands Construction Ltd).
import type { Employee, PayrollRun, AppSettings, Company } from '@/types';
import { uuid } from './utils';
import { hashPin, DEFAULT_PIN } from './pin';
import { buildLineItem, assembleRun } from './payroll';
import {
  employeeStorage,
  payrollStorage,
  settingsStorage,
} from './storage';

export const SEED_COMPANY: Company = {
  name: 'Highlands Construction Ltd',
  tradingName: 'Highlands Construction',
  ipaNumber: '1-56789',
  tinnNumber: '500123456',
  address: 'Section 34, Lot 12, Waigani Drive',
  city: 'Port Moresby',
  province: 'National Capital District',
  phone: '+675 325 1234',
  email: 'accounts@highlandsconstruction.com.pg',
  industry: 'Construction',
  payrollOfficerName: 'Mary Kapi',
  payrollOfficerEmail: 'mary.kapi@highlandsconstruction.com.pg',
};

function buildSettings(pinHash: string): AppSettings {
  return {
    company: SEED_COMPANY,
    currentTaxYear: '2025',
    defaultPayPeriod: 'fortnightly',
    nasfundEmployeeRate: 6,
    nasfundEmployerRate: 8.4,
    currency: 'PGK',
    dateFormat: 'DD/MM/YYYY',
    pinHash,
  };
}

const now = new Date().toISOString();

function emp(partial: Partial<Employee> & Pick<Employee, 'employeeNumber' | 'firstName' | 'lastName' | 'department' | 'position' | 'grossFortnightlySalary'>): Employee {
  return {
    id: uuid(),
    dateOfBirth: '1990-01-01',
    gender: 'male',
    phone: '+675 7000 0000',
    employmentType: 'permanent',
    startDate: '2022-01-10',
    status: 'active',
    paymentMethod: 'bank',
    taxExempt: false,
    nasfundMember: true,
    housingAllowance: 0,
    vehicleAllowance: 0,
    mealAllowance: 0,
    otherAllowances: 0,
    annualLeaveBalance: 14,
    sickLeaveBalance: 6,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function buildEmployees(): Employee[] {
  return [
    emp({
      employeeNumber: 'EMP-001',
      firstName: 'John',
      lastName: 'Kila',
      gender: 'male',
      dateOfBirth: '1985-04-12',
      phone: '+675 7123 4567',
      email: 'john.kila@highlandsconstruction.com.pg',
      department: 'Operations',
      position: 'Site Supervisor',
      grossFortnightlySalary: 2800,
      paymentMethod: 'bank',
      bankName: 'BSP',
      bankAccountNumber: '1000124521',
      bankBSBCode: '088-950',
      tfn: '123-456-789',
      nasfundMember: true,
      nasfundMemberNumber: 'NF-789012',
      housingAllowance: 500,
      vehicleAllowance: 200,
      mealAllowance: 100,
      annualLeaveBalance: 18,
      sickLeaveBalance: 8,
    }),
    emp({
      employeeNumber: 'EMP-002',
      firstName: 'Sarah',
      lastName: 'Naime',
      gender: 'female',
      dateOfBirth: '1992-09-03',
      phone: '+675 7234 5678',
      email: 'sarah.naime@highlandsconstruction.com.pg',
      department: 'Administration',
      position: 'Admin Officer',
      grossFortnightlySalary: 1600,
      paymentMethod: 'cash',
      tfn: '234-567-890',
      nasfundMember: true,
      nasfundMemberNumber: 'NF-456123',
      mealAllowance: 80,
      annualLeaveBalance: 12,
      sickLeaveBalance: 5,
    }),
    emp({
      employeeNumber: 'EMP-003',
      firstName: 'Peter',
      lastName: 'Waramo',
      gender: 'male',
      dateOfBirth: '1988-12-20',
      phone: '+675 7345 6789',
      email: 'peter.waramo@highlandsconstruction.com.pg',
      department: 'Engineering',
      position: 'Civil Engineer',
      grossFortnightlySalary: 4500,
      paymentMethod: 'bank',
      bankName: 'Kina Bank',
      bankAccountNumber: '2000338812',
      bankBSBCode: '089-002',
      tfn: '345-678-901',
      nasfundMember: true,
      nasfundMemberNumber: 'NF-223344',
      housingAllowance: 800,
      vehicleAllowance: 400,
      mealAllowance: 100,
      annualLeaveBalance: 22,
      sickLeaveBalance: 10,
    }),
    emp({
      employeeNumber: 'EMP-004',
      firstName: 'Grace',
      lastName: 'Mondo',
      gender: 'female',
      dateOfBirth: '1991-06-15',
      phone: '+675 7456 7890',
      email: 'grace.mondo@highlandsconstruction.com.pg',
      department: 'Finance',
      position: 'Accountant',
      grossFortnightlySalary: 3200,
      paymentMethod: 'bank',
      bankName: 'ANZ',
      bankAccountNumber: '3000447799',
      bankBSBCode: '018-944',
      tfn: '456-789-012',
      nasfundMember: true,
      nasfundMemberNumber: 'NF-998877',
      housingAllowance: 600,
      vehicleAllowance: 150,
      annualLeaveBalance: 16,
      sickLeaveBalance: 7,
    }),
    emp({
      employeeNumber: 'EMP-005',
      firstName: 'Thomas',
      lastName: 'Boas',
      gender: 'male',
      dateOfBirth: '1996-02-28',
      phone: '+675 7567 8901',
      department: 'Operations',
      position: 'General Labourer',
      employmentType: 'casual',
      grossFortnightlySalary: 950,
      paymentMethod: 'cash',
      tfn: undefined, // No TFN — demonstrates the 42% max-rate rule + amber flag
      nasfundMember: false,
      annualLeaveBalance: 4,
      sickLeaveBalance: 2,
    }),
  ];
}

function buildRuns(employees: Employee[], settings: AppSettings): PayrollRun[] {
  const periods = [
    { runNumber: 'PR-2025-001', periodStart: '2025-01-01', periodEnd: '2025-01-14', payDate: '2025-01-16' },
    { runNumber: 'PR-2025-002', periodStart: '2025-01-15', periodEnd: '2025-01-28', payDate: '2025-01-30' },
  ];

  return periods.map((p) => {
    const items = employees.map((e) => buildLineItem(e, settings));
    return assembleRun(
      {
        id: uuid(),
        runNumber: p.runNumber,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        payDate: p.payDate,
        status: 'completed',
        createdAt: `${p.payDate}T08:00:00.000Z`,
        processedAt: `${p.payDate}T08:30:00.000Z`,
        notes: undefined,
      },
      items,
    );
  });
}

/**
 * Seed first-run data if the store is empty. Returns the AppSettings (existing
 * or freshly seeded) so the caller can hydrate the settings store.
 */
export async function initializeData(): Promise<AppSettings> {
  let settings = settingsStorage.get();

  if (!settings) {
    const pinHash = await hashPin(DEFAULT_PIN);
    settings = buildSettings(pinHash);
    settingsStorage.save(settings);
  }

  if (employeeStorage.all().length === 0) {
    const employees = buildEmployees();
    employeeStorage.save(employees);

    if (payrollStorage.all().length === 0) {
      payrollStorage.save(buildRuns(employees, settings));
    }
  }

  return settings;
}
