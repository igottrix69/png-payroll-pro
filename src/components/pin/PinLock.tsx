import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { PinDots, PinKeypad } from './PinKeypad';
import { LogoMark } from '@/components/shared/Logo';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { verifyPin } from '@/lib/pin';
import { resetAll } from '@/lib/storage';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export function PinLock() {
  const settings = useSettingsStore((s) => s.settings);
  const touchLogin = useSettingsStore((s) => s.touchLogin);
  const unlock = useAuthStore((s) => s.unlock);

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const lockedOut = lockoutUntil !== null && remaining > 0;

  // Lockout countdown
  useEffect(() => {
    if (lockoutUntil === null) return;
    const tick = () => {
      const secs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setRemaining(Math.max(0, secs));
      if (secs <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const submit = useCallback(
    async (candidate: string) => {
      if (!settings) return;
      const ok = await verifyPin(candidate, settings.pinHash);
      if (ok) {
        touchLogin();
        unlock();
        return;
      }
      // wrong PIN
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 500);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        toast.error(`Too many attempts — locked for ${LOCKOUT_SECONDS}s`);
      } else {
        toast.error(`Incorrect PIN (${MAX_ATTEMPTS - nextAttempts} left)`);
      }
    },
    [settings, attempts, touchLogin, unlock],
  );

  const pushDigit = useCallback(
    (d: string) => {
      if (lockedOut) return;
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + d;
        if (next.length === PIN_LENGTH) void submit(next);
        return next;
      });
    },
    [lockedOut, submit],
  );

  const backspace = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) pushDigit(e.key);
      else if (e.key === 'Backspace') backspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pushDigit, backspace]);

  const doReset = () => {
    resetAll();
    toast.success('All data reset. Reloading…');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      {/* subtle burgundy glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(139,0,0,0.25) 0%, rgba(15,0,0,0) 70%)',
        }}
      />
      <div className="animate-fade-up relative w-full max-w-[360px] rounded-[10px] border border-line bg-card/80 p-7 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={56} />
          <h1 className="mt-4 text-xl font-semibold text-ink">
            PNG Payroll <span className="text-gold">Pro</span>
          </h1>
          <p className="mt-1 text-[12px] text-muted">Secure • IRC-Compliant • Built for PNG</p>
        </div>

        <div className="my-7">
          <PinDots length={PIN_LENGTH} filled={pin.length} error={error} />
        </div>

        {lockedOut ? (
          <div className="mb-5 rounded-[6px] border border-danger/30 bg-danger/10 px-4 py-3 text-center text-[13px] text-danger">
            Too many failed attempts.
            <div className="tnum mt-1 text-2xl font-semibold">{remaining}s</div>
            <div className="text-[11px] text-muted">Please wait before trying again</div>
          </div>
        ) : (
          <PinKeypad onDigit={pushDigit} onBackspace={backspace} disabled={lockedOut} />
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-faint">
          <ShieldCheck size={13} />
          <span>Default PIN is 0000 — change it in Settings</span>
        </div>

        <button
          onClick={() => setConfirmReset(true)}
          className="mt-3 w-full text-center text-[11px] text-faint underline-offset-2 hover:text-muted hover:underline"
        >
          Forgot PIN? Reset all data
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        danger
        title="Reset all data?"
        confirmLabel="Erase everything"
        message={
          <>
            This permanently deletes <strong>all employees, payroll runs, leave records and
            settings</strong>, and resets the PIN to <strong>0000</strong>. This cannot be undone.
          </>
        }
      />
    </div>
  );
}
