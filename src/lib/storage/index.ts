// lib/storage/index.ts — localStorage persistence abstraction.
//
// Everything funnels through read()/write() so the entire data layer can be
// swapped for a PostgreSQL/HTTP backend later without touching the UI or stores.
import type { Employee, PayrollRun, AppSettings, LeaveRecord } from '@/types';

export const STORAGE_KEYS = {
  employees: 'pp_employees',
  payrollRuns: 'pp_payroll_runs',
  settings: 'pp_settings',
  leave: 'pp_leave',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function read<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: StorageKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Surfaced by callers via toast where relevant.
    console.error(`Failed to persist ${key}`, err);
  }
}

/* ----------------------------------------------------------------- entities */

export const employeeStorage = {
  all: (): Employee[] => read<Employee[]>(STORAGE_KEYS.employees, []),
  save: (list: Employee[]) => write(STORAGE_KEYS.employees, list),
};

export const payrollStorage = {
  all: (): PayrollRun[] => read<PayrollRun[]>(STORAGE_KEYS.payrollRuns, []),
  save: (list: PayrollRun[]) => write(STORAGE_KEYS.payrollRuns, list),
};

export const leaveStorage = {
  all: (): LeaveRecord[] => read<LeaveRecord[]>(STORAGE_KEYS.leave, []),
  save: (list: LeaveRecord[]) => write(STORAGE_KEYS.leave, list),
};

export const settingsStorage = {
  get: (): AppSettings | null => read<AppSettings | null>(STORAGE_KEYS.settings, null),
  save: (settings: AppSettings) => write(STORAGE_KEYS.settings, settings),
};

/* --------------------------------------------------------- backup / restore */

export interface BackupPayload {
  app: 'png-payroll-pro';
  version: 1;
  exportedAt: string;
  employees: Employee[];
  payrollRuns: PayrollRun[];
  leave: LeaveRecord[];
  settings: AppSettings | null;
}

export function exportAll(): BackupPayload {
  return {
    app: 'png-payroll-pro',
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: employeeStorage.all(),
    payrollRuns: payrollStorage.all(),
    leave: leaveStorage.all(),
    settings: settingsStorage.get(),
  };
}

export function importAll(payload: BackupPayload): void {
  if (!payload || payload.app !== 'png-payroll-pro') {
    throw new Error('Invalid backup file — not a PNG Payroll Pro export.');
  }
  if (payload.employees) employeeStorage.save(payload.employees);
  if (payload.payrollRuns) payrollStorage.save(payload.payrollRuns);
  if (payload.leave) leaveStorage.save(payload.leave);
  if (payload.settings) settingsStorage.save(payload.settings);
}

/** Nuclear reset — clears all app data (PIN included; reverts to default 0000). */
export function resetAll(): void {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}
