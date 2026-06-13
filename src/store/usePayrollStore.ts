// store/usePayrollStore.ts
import { create } from 'zustand';
import type { PayrollRun } from '@/types';
import { payrollStorage } from '@/lib/storage';

interface PayrollState {
  runs: PayrollRun[];
  hydrate: () => void;
  addRun: (run: PayrollRun) => void;
  updateRun: (id: string, patch: Partial<PayrollRun>) => void;
  removeRun: (id: string) => void;
  getRun: (id: string) => PayrollRun | undefined;
  nextRunNumber: (taxYear: string) => string;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  runs: [],

  hydrate: () => set({ runs: payrollStorage.all() }),

  addRun: (run) => {
    const runs = [run, ...get().runs];
    payrollStorage.save(runs);
    set({ runs });
  },

  updateRun: (id, patch) => {
    const runs = get().runs.map((r) => (r.id === id ? { ...r, ...patch } : r));
    payrollStorage.save(runs);
    set({ runs });
  },

  removeRun: (id) => {
    const runs = get().runs.filter((r) => r.id !== id);
    payrollStorage.save(runs);
    set({ runs });
  },

  getRun: (id) => get().runs.find((r) => r.id === id),

  nextRunNumber: (taxYear) => {
    const prefix = `PR-${taxYear}-`;
    const nums = get()
      .runs.filter((r) => r.runNumber.startsWith(prefix))
      .map((r) => parseInt(r.runNumber.slice(prefix.length), 10))
      .filter((n) => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  },
}));
