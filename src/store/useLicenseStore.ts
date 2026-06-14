// store/useLicenseStore.ts
import { create } from 'zustand';
import {
  getLicenseStatus,
  activateLicense,
  startTrial,
  clearLicense,
  type LicenseStatus,
} from '@/lib/license';

const NONE: LicenseStatus = {
  valid: false,
  payload: null,
  isTrial: false,
  expired: false,
  daysLeft: null,
  reason: 'none',
};

interface LicenseState {
  status: LicenseStatus | null;
  refresh: () => Promise<LicenseStatus>;
  activate: (token: string) => Promise<LicenseStatus>;
  startTrial: () => Promise<LicenseStatus>;
  deactivate: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  status: null,
  refresh: async () => {
    const s = await getLicenseStatus();
    set({ status: s });
    return s;
  },
  activate: async (token) => {
    const s = await activateLicense(token);
    if (s.valid) set({ status: s });
    return s;
  },
  startTrial: async () => {
    const s = await startTrial();
    set({ status: s });
    return s;
  },
  deactivate: () => {
    clearLicense();
    set({ status: NONE });
  },
}));
