// store/useLeaveStore.ts
import { create } from 'zustand';
import type { LeaveRecord } from '@/types';
import { leaveStorage } from '@/lib/storage';
import { uuid } from '@/lib/utils';

interface LeaveState {
  records: LeaveRecord[];
  hydrate: () => void;
  add: (data: Omit<LeaveRecord, 'id' | 'createdAt'>) => LeaveRecord;
  remove: (id: string) => void;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  records: [],

  hydrate: () => set({ records: leaveStorage.all() }),

  add: (data) => {
    const record: LeaveRecord = { ...data, id: uuid(), createdAt: new Date().toISOString() };
    const records = [record, ...get().records];
    leaveStorage.save(records);
    set({ records });
    return record;
  },

  remove: (id) => {
    const records = get().records.filter((r) => r.id !== id);
    leaveStorage.save(records);
    set({ records });
  },
}));
