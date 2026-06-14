import { useRef, useState } from 'react';
import {
  Building2,
  KeyRound,
  Percent,
  Database,
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
  BadgeCheck,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { FormField, Input, Select } from '@/components/shared/Input';
import { PinDots, PinKeypad } from '@/components/pin/PinKeypad';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LogoMark } from '@/components/shared/Logo';
import type { Company } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useLicenseStore } from '@/store/useLicenseStore';
import { TIER_META, purchaseMailto } from '@/lib/license';
import { hashPin, verifyPin } from '@/lib/pin';
import { exportAll, importAll, resetAll, type BackupPayload } from '@/lib/storage';
import { cn, num } from '@/lib/utils';

type Tab = 'company' | 'pin' | 'tax' | 'license' | 'data';
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'pin', label: 'Security PIN', icon: KeyRound },
  { id: 'tax', label: 'Tax & Super', icon: Percent },
  { id: 'license', label: 'Licence', icon: BadgeCheck },
  { id: 'data', label: 'Data', icon: Database },
];

export function Settings() {
  const [tab, setTab] = useState<Tab>('company');
  return (
    <>
      <TopBar title="Settings" subtitle="Company, security, tax rates & data management" />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
          <nav className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] font-medium',
                  tab === t.id ? 'bg-brand text-white' : 'text-muted hover:bg-card-2 hover:text-ink',
                )}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </nav>
          <div>
            {tab === 'company' && <CompanySettings />}
            {tab === 'pin' && <PinSettings />}
            {tab === 'tax' && <TaxSettings />}
            {tab === 'license' && <LicenseSettings />}
            {tab === 'data' && <DataSettings />}
          </div>
        </div>
      </PageBody>
    </>
  );
}

/* ---------------------------------------------------------------- Company */

function CompanySettings() {
  const company = useSettingsStore((s) => s.settings!.company);
  const updateCompany = useSettingsStore((s) => s.updateCompany);
  const [form, setForm] = useState<Company>({ ...company });
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Company>(k: K, v: Company[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onLogo(file?: File) {
    if (!file) return;
    if (file.size > 500_000) {
      toast.error('Logo must be under 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logoBase64', reader.result as string);
    reader.readAsDataURL(file);
  }

  function save() {
    updateCompany(form);
    toast.success('Company details saved');
  }

  return (
    <Card>
      <CardHeader title="Company Information" />
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[8px] border border-line bg-card-2">
            {form.logoBase64 ? (
              <img src={form.logoBase64} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <LogoMark size={44} />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
            <Button variant="outline" size="sm" icon={<ImageIcon size={14} />} onClick={() => fileRef.current?.click()}>
              Upload Logo
            </Button>
            {form.logoBase64 && (
              <Button variant="ghost" size="sm" onClick={() => set('logoBase64', undefined)} className="ml-2 text-danger">
                Remove
              </Button>
            )}
            <p className="mt-1 text-[11px] text-faint">Used on payslip PDFs. PNG/JPG under 500KB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <FormField label="Company Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></FormField>
          <FormField label="Trading Name"><Input value={form.tradingName ?? ''} onChange={(e) => set('tradingName', e.target.value)} /></FormField>
          <FormField label="IPA Number"><Input value={form.ipaNumber ?? ''} onChange={(e) => set('ipaNumber', e.target.value)} mono /></FormField>
          <FormField label="TIN"><Input value={form.tinnNumber ?? ''} onChange={(e) => set('tinnNumber', e.target.value)} mono /></FormField>
          <FormField label="Address" className="sm:col-span-2"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></FormField>
          <FormField label="City"><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></FormField>
          <FormField label="Province"><Input value={form.province} onChange={(e) => set('province', e.target.value)} /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></FormField>
          <FormField label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></FormField>
          <FormField label="Industry"><Input value={form.industry} onChange={(e) => set('industry', e.target.value)} /></FormField>
          <div />
          <FormField label="Payroll Officer Name"><Input value={form.payrollOfficerName} onChange={(e) => set('payrollOfficerName', e.target.value)} /></FormField>
          <FormField label="Payroll Officer Email"><Input value={form.payrollOfficerEmail} onChange={(e) => set('payrollOfficerEmail', e.target.value)} /></FormField>
        </div>

        <div className="flex justify-end">
          <Button onClick={save}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------- PIN */

function PinSettings() {
  const pinHash = useSettingsStore((s) => s.settings!.pinHash);
  const setPinHash = useSettingsStore((s) => s.setPinHash);

  const [stage, setStage] = useState<'current' | 'new' | 'confirm'>('current');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const valueFor = { current, new: next, confirm }[stage];

  async function push(d: string) {
    if (valueFor.length >= 4) return;
    const v = valueFor + d;
    if (stage === 'current') {
      setCurrent(v);
      if (v.length === 4) {
        const ok = await verifyPin(v, pinHash);
        if (!ok) {
          toast.error('Current PIN is incorrect');
          setCurrent('');
          return;
        }
        setStage('new');
      }
    } else if (stage === 'new') {
      setNext(v);
      if (v.length === 4) setStage('confirm');
    } else {
      setConfirm(v);
      if (v.length === 4) {
        if (v !== next) {
          toast.error('PINs do not match');
          setNext('');
          setConfirm('');
          setStage('new');
          return;
        }
        const h = await hashPin(v);
        setPinHash(h);
        toast.success('PIN updated successfully');
        setCurrent('');
        setNext('');
        setConfirm('');
        setStage('current');
      }
    }
  }

  function backspace() {
    if (stage === 'current') setCurrent((p) => p.slice(0, -1));
    else if (stage === 'new') setNext((p) => p.slice(0, -1));
    else setConfirm((p) => p.slice(0, -1));
  }

  const Row = ({ label, value, active }: { label: string; value: string; active: boolean }) => (
    <div className={cn('flex items-center justify-between rounded-[6px] border px-4 py-3', active ? 'border-brand-light bg-card-2' : 'border-line')}>
      <span className="text-[13px] text-muted">{label}</span>
      <PinDots length={4} filled={value.length} />
    </div>
  );

  return (
    <Card>
      <CardHeader title="Change Security PIN" />
      <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
        <div className="space-y-3">
          <Row label="Current PIN" value={current} active={stage === 'current'} />
          <Row label="New PIN" value={next} active={stage === 'new'} />
          <Row label="Confirm PIN" value={confirm} active={stage === 'confirm'} />
          <div className="flex items-start gap-2 rounded-[6px] border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            Write down your new PIN. Losing it requires a full data reset.
          </div>
        </div>
        <div className="mx-auto w-full max-w-[240px]">
          <PinKeypad onDigit={push} onBackspace={backspace} />
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- Tax/Super */

function TaxSettings() {
  const settings = useSettingsStore((s) => s.settings!);
  const updateTax = useSettingsStore((s) => s.updateTax);
  const [taxYear, setTaxYear] = useState(settings.currentTaxYear);
  const [ee, setEe] = useState(settings.nasfundEmployeeRate);
  const [er, setEr] = useState(settings.nasfundEmployerRate);
  const [period, setPeriod] = useState(settings.defaultPayPeriod);

  const years = ['2024', '2025', '2026', '2027'];

  function save() {
    updateTax({ currentTaxYear: taxYear, nasfundEmployeeRate: ee, nasfundEmployerRate: er, defaultPayPeriod: period });
    toast.success('Tax & super settings saved');
  }

  return (
    <Card>
      <CardHeader title="Tax & Super Settings" />
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <FormField label="Current Tax Year">
            <Select value={taxYear} onChange={(e) => setTaxYear(e.target.value)}>
              {years.map((y) => <option key={y}>{y}</option>)}
            </Select>
          </FormField>
          <FormField label="Default Pay Period">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="fortnightly">Fortnightly</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </FormField>
          <FormField label="Nasfund Employee Rate (%)" hint="statutory 6%">
            <Input type="number" min={0} step="0.1" value={ee} onChange={(e) => setEe(num(e.target.value))} mono />
          </FormField>
          <FormField label="Nasfund Employer Rate (%)" hint="statutory 8.4%">
            <Input type="number" min={0} step="0.1" value={er} onChange={(e) => setEr(num(e.target.value))} mono />
          </FormField>
        </div>
        <div className="rounded-[6px] border border-line bg-card-2 px-4 py-3 text-[12px] text-muted">
          SWT is calculated on the current PNG IRC resident fortnightly schedule (K20,000 tax-free threshold;
          marginal rates 30 / 35 / 40 / 42%). Employees without a TFN are taxed at the maximum 42% rate.
        </div>
        <div className="flex justify-end">
          <Button onClick={save}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- Licence */

function LicenseSettings() {
  const status = useLicenseStore((s) => s.status);
  const activate = useLicenseStore((s) => s.activate);
  const deactivate = useLicenseStore((s) => s.deactivate);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  const p = status?.payload;
  const tierLabel = p ? TIER_META[p.tier].label : '—';
  const capLabel = !p ? '—' : p.maxEmployees === 0 ? 'Unlimited' : `${p.maxEmployees} staff`;
  const expiryLabel = !p
    ? '—'
    : status?.isTrial
      ? `Trial — ${status.daysLeft ?? 0} day(s) left`
      : p.expires
        ? `Expires ${new Date(p.expires).toLocaleDateString()}`
        : 'Perpetual';

  async function onActivate() {
    if (!key.trim()) return;
    setBusy(true);
    const res = await activate(key);
    setBusy(false);
    if (res.valid) {
      toast.success(`Licence activated — ${res.payload?.company}`);
      setKey('');
    } else {
      toast.error(res.expired ? 'That key has expired' : 'Invalid licence key');
    }
  }

  return (
    <Card>
      <CardHeader title="Licence" />
      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line sm:grid-cols-4">
          <Info label="Licensed to" value={p?.company ?? 'Unlicensed'} />
          <Info label="Plan" value={tierLabel} />
          <Info label="Staff limit" value={capLabel} />
          <Info label="Status" value={expiryLabel} />
        </div>

        {status?.isTrial && (
          <div className="flex items-center justify-between gap-3 rounded-[6px] border border-warning/30 bg-warning/10 px-4 py-3 text-[12px] text-warning">
            <span>You're on a free trial (limited to {TIER_META.trial.maxEmployees} staff). Buy a licence to unlock the full app.</span>
            <Button variant="gold" size="sm" icon={<ShoppingCart size={14} />} onClick={() => window.open(purchaseMailto({ company: p?.company }), '_blank')}>
              Buy
            </Button>
          </div>
        )}

        <div>
          <FormField label={status?.isTrial ? 'Enter your licence key' : 'Replace licence key'}>
            <textarea
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste a licence key…"
              className="min-h-[80px] w-full rounded-[4px] border border-line bg-card-2 px-3 py-2 font-mono text-[11px] text-ink focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand-light/30"
            />
          </FormField>
          <div className="mt-3 flex justify-between">
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => setConfirmOff(true)}>
              Deactivate this device
            </Button>
            <Button onClick={onActivate} loading={busy} disabled={!key.trim()}>
              Activate
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        onConfirm={() => {
          deactivate();
          toast.success('Licence removed from this device');
        }}
        danger
        title="Deactivate licence?"
        confirmLabel="Deactivate"
        message="This removes the licence key from this device and returns to the activation screen. Your payroll data is kept. You'll need the key to get back in."
      />
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-3.5">
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-ink">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------- Data */

function DataSettings() {
  const importRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const hydrateAll = useReloadAfter();

  function doExport() {
    const data = exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `png-payroll-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exported');
  }

  function doImport(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string) as BackupPayload;
        importAll(payload);
        toast.success('Data imported — reloading…');
        setTimeout(hydrateAll, 700);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  }

  return (
    <Card>
      <CardHeader title="Data Management" />
      <div className="space-y-3 p-5">
        <DataRow
          title="Export All Data (JSON)"
          desc="Download a full backup of employees, payroll, leave and settings."
          action={<Button variant="outline" icon={<Download size={15} />} onClick={doExport}>Export</Button>}
        />
        <DataRow
          title="Import Data (JSON)"
          desc="Restore from a previously exported backup. Overwrites current data."
          action={
            <>
              <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => doImport(e.target.files?.[0])} />
              <Button variant="outline" icon={<Upload size={15} />} onClick={() => importRef.current?.click()}>Import</Button>
            </>
          }
        />
        <DataRow
          title="Reset All Data"
          desc="Permanently erase everything and reset the PIN to 0000."
          danger
          action={<Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirmReset(true)}>Reset</Button>}
        />
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll();
          toast.success('All data reset — reloading…');
          setTimeout(() => window.location.reload(), 600);
        }}
        danger
        title="Reset all data?"
        confirmLabel="Erase everything"
        message="This permanently deletes all employees, payroll runs, leave records and settings, and resets the PIN to 0000. This cannot be undone."
      />
    </Card>
  );
}

function DataRow({ title, desc, action, danger }: { title: string; desc: string; action: React.ReactNode; danger?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 rounded-[6px] border px-4 py-3.5', danger ? 'border-danger/30 bg-danger/5' : 'border-line bg-card-2')}>
      <div>
        <div className={cn('text-[13px] font-medium', danger ? 'text-danger' : 'text-ink')}>{title}</div>
        <div className="text-[12px] text-muted">{desc}</div>
      </div>
      {action}
    </div>
  );
}

/** After an import we simply reload so every store re-hydrates from storage. */
function useReloadAfter() {
  return () => window.location.reload();
}
