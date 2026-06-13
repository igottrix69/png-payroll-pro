// store/useEmployeeStore.ts
import { create } from 'zustand';
import type { Employee } from '@/types';
import { employeeStorage } from '@/lib/storage';
import { uuid } from '@/lib/utils';

interface EmployeeState {
  employees: Employee[];
  hydrate: () => void;
  add: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Employee;
  update: (id: string, patch: Partial<Employee>) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: Employee['status']) => void;
  nextEmployeeNumber: () => string;
  adjustLeaveBalance: (id: string, type: 'annual' | 'sick', deltaDays: number) => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],

  hydrate: () => set({ employees: employeeStorage.all() }),

  add: (data) => {
    const now = new Date().toISOString();
    const employee: Employee = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    const employees = [...get().employees, employee];
    employeeStorage.save(employees);
    set({ employees });
    return employee;
  },

  update: (id, patch) => {
    const employees = get().employees.map((e) =>
      e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
    );
    employeeStorage.save(employees);
    set({ employees });
  },

  remove: (id) => {
    const employees = get().employees.filter((e) => e.id !== id);
    employeeStorage.save(employees);
    set({ employees });
  },

  setStatus: (id, status) => get().update(id, { status }),

  nextEmployeeNumber: () => {
    const nums = get()
      .employees.map((e) => {
        const m = e.employeeNumber.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => Number.isFinite(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `EMP-${String(next).padStart(3, '0')}`;
  },

  adjustLeaveBalance: (id, type, deltaDays) => {
    const emp = get().employees.find((e) => e.id === id);
    if (!emp) return;
    if (type === 'annual') {
      get().update(id, { annualLeaveBalance: Math.max(0, emp.annualLeaveBalance + deltaDays) });
    } else {
      get().update(id, { sickLeaveBalance: Math.max(0, emp.sickLeaveBalance + deltaDays) });
    }
  },
}));
