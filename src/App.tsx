import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogoMark } from '@/components/shared/Logo';
import { PinLock } from '@/components/pin/PinLock';
import { AppShell } from '@/components/layout/AppShell';
import { Dashboard } from '@/pages/Dashboard';
import { Employees } from '@/pages/Employees';
import { PayrollNew } from '@/pages/PayrollNew';
import { PayrollHistory } from '@/pages/PayrollHistory';
import { PayrollDetail } from '@/pages/PayrollDetail';
import { Payslips } from '@/pages/Payslips';
import { Reports } from '@/pages/Reports';
import { Leave } from '@/pages/Leave';
import { Settings } from '@/pages/Settings';
import { initializeData } from '@/lib/seed';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePayrollStore } from '@/store/usePayrollStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function App() {
  const [ready, setReady] = useState(false);
  const unlocked = useAuthStore((s) => s.unlocked);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateEmployees = useEmployeeStore((s) => s.hydrate);
  const hydratePayroll = usePayrollStore((s) => s.hydrate);
  const hydrateLeave = useLeaveStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      const settings = await initializeData();
      hydrateSettings(settings);
      hydrateEmployees();
      hydratePayroll();
      hydrateLeave();
      setReady(true);
    })();
  }, [hydrateSettings, hydrateEmployees, hydratePayroll, hydrateLeave]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            boxShadow: '0 6px 24px rgba(15,23,42,0.10)',
          },
        }}
      />
      {!ready ? (
        <Splash />
      ) : !unlocked ? (
        <PinLock />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/payroll" element={<PayrollHistory />} />
              <Route path="/payroll/new" element={<PayrollNew />} />
              <Route path="/payroll/:id" element={<PayrollDetail />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
      <LogoMark size={56} />
      <div className="text-sm text-muted">Loading PNG Payroll Pro…</div>
    </div>
  );
}
