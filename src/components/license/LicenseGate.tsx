import { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Clock, ShoppingCart, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/shared/Logo';
import { Button } from '@/components/shared/Button';
import { Textarea } from '@/components/shared/Input';
import { useLicenseStore } from '@/store/useLicenseStore';
import { purchaseMailto, TRIAL_DAYS, PLANS, ANNUAL_UPDATE_PRICE, formatPrice } from '@/lib/license';

export function LicenseGate() {
  const status = useLicenseStore((s) => s.status);
  const activate = useLicenseStore((s) => s.activate);
  const beginTrial = useLicenseStore((s) => s.startTrial);

  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  const trialUsedUp = status?.isTrial && status?.expired;
  const licenseExpired = !status?.isTrial && status?.expired;
  const invalid = status?.reason === 'invalid';

  async function onActivate() {
    if (!key.trim()) return;
    setBusy(true);
    const result = await activate(key);
    setBusy(false);
    if (result.valid) {
      toast.success(`Activated — licensed to ${result.payload?.company}`);
    } else {
      toast.error(result.expired ? 'That licence key has expired' : 'Invalid licence key');
    }
  }

  async function onTrial() {
    setBusy(true);
    const result = await beginTrial();
    setBusy(false);
    if (result.valid) toast.success(`${TRIAL_DAYS}-day trial started`);
    else toast.error('Your trial has already ended');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(53,131,255,0.16) 0%, rgba(244,247,251,0) 70%)' }}
      />
      <div className="animate-fade-up relative w-full max-w-[460px] rounded-[10px] border border-line bg-card p-7 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={56} />
          <h1 className="mt-4 text-xl font-semibold text-ink">
            Activate PNG Payroll <span className="text-brand">Pro</span>
          </h1>
          <p className="mt-1 text-[12px] text-muted">Enter your licence key, or start a free trial</p>
        </div>

        {(trialUsedUp || licenseExpired) && (
          <div className="mt-5 rounded-[6px] border border-warning/30 bg-warning/10 px-4 py-3 text-center text-[13px] text-warning">
            {trialUsedUp
              ? `Your ${TRIAL_DAYS}-day trial has ended. Enter a licence key to continue.`
              : 'Your licence has expired. Please renew to continue.'}
          </div>
        )}

        <div className="mt-5">
          <label className="mb-1.5 block text-[12px] font-medium text-muted">Licence key</label>
          <Textarea
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste the licence key from your purchase email…"
            className={`min-h-[88px] font-mono text-[11px] ${invalid ? 'border-danger' : ''}`}
          />
          <Button className="mt-3 w-full" icon={<KeyRound size={15} />} onClick={onActivate} loading={busy} disabled={!key.trim()}>
            Activate Licence
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-[11px] text-faint">
          <span className="h-px flex-1 bg-line" />
          OR
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="outline" icon={<Clock size={15} />} onClick={onTrial} disabled={busy || trialUsedUp}>
            {trialUsedUp ? 'Trial used' : `Start ${TRIAL_DAYS}-day trial`}
          </Button>
          <Button variant="gold" icon={<ShoppingCart size={15} />} onClick={() => window.open(purchaseMailto(), '_blank')}>
            Buy a licence
          </Button>
        </div>

        <div className="mt-5 rounded-[6px] border border-line bg-card-2 p-3">
          <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-faint">
            One-off licence — pay once, own it
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {PLANS.map((p) => (
              <div key={p.tier} className="rounded-[4px] border border-line bg-card px-2 py-2">
                <div className="text-[11px] text-muted">{p.label}</div>
                <div className="tnum text-sm font-semibold text-ink">{formatPrice(p.price)}</div>
                <div className="text-[10px] text-faint">{p.staff}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-[10px] text-faint">
            + optional {formatPrice(ANNUAL_UPDATE_PRICE)}/yr updates &amp; support
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-faint">
          <ShieldCheck size={13} />
          <span>Licences are verified offline — your data never leaves this device</span>
        </div>
      </div>
    </div>
  );
}
