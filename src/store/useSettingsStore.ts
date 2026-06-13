// store/useSettingsStore.ts
import { create } from 'zustand';
import type { AppSettings, Company } from '@/types';
import { settingsStorage } from '@/lib/storage';

interface SettingsState {
  settings: AppSettings | null;
  hydrate: (settings: AppSettings) => void;
  setSettings: (settings: AppSettings) => void;
  updateCompany: (company: Partial<Company>) => void;
  updateTax: (patch: Partial<Pick<AppSettings, 'currentTaxYear' | 'nasfundEmployeeRate' | 'nasfundEmployerRate' | 'defaultPayPeriod'>>) => void;
  setPinHash: (hash: string) => void;
  touchLogin: () => void;
}

function persist(settings: AppSettings) {
  settingsStorage.save(settings);
  return settings;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,

  hydrate: (settings) => set({ settings }),

  setSettings: (settings) => set({ settings: persist(settings) }),

  updateCompany: (company) => {
    const cur = get().settings;
    if (!cur) return;
    set({ settings: persist({ ...cur, company: { ...cur.company, ...company } }) });
  },

  updateTax: (patch) => {
    const cur = get().settings;
    if (!cur) return;
    set({ settings: persist({ ...cur, ...patch }) });
  },

  setPinHash: (pinHash) => {
    const cur = get().settings;
    if (!cur) return;
    set({ settings: persist({ ...cur, pinHash }) });
  },

  touchLogin: () => {
    const cur = get().settings;
    if (!cur) return;
    set({ settings: persist({ ...cur, lastLogin: new Date().toISOString() }) });
  },
}));
