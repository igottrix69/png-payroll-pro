// lib/license.ts — Offline licence verification, trial handling & storage.
//
// A licence is a signed token: base64url(payload JSON) + "." + base64url(signature).
// The signature is ECDSA P-256 / SHA-256 over a canonical string, made with the
// vendor PRIVATE key (scripts/license-gen.mjs) and verified here with the embedded
// PUBLIC key. This lets the app validate licences fully offline — no server needed.
//
// NOTE: client-side licensing deters casual copying; it is not unbreakable DRM.
import { LICENSE_PUBLIC_JWK } from './licenseKey';

export type LicenseTier = 'trial' | 'starter' | 'business' | 'enterprise';

export interface LicensePayload {
  company: string;
  tier: LicenseTier;
  /** Max active employees. 0 = unlimited. */
  maxEmployees: number;
  /** ISO date issued. */
  issued: string;
  /** ISO date of expiry, or '' for a perpetual licence. */
  expires: string;
}

export interface LicenseStatus {
  valid: boolean;
  payload: LicensePayload | null;
  isTrial: boolean;
  expired: boolean;
  daysLeft: number | null; // null = perpetual
  reason?: 'none' | 'invalid' | 'expired';
}

export const TIER_META: Record<LicenseTier, { label: string; maxEmployees: number }> = {
  trial: { label: 'Trial', maxEmployees: 5 },
  starter: { label: 'Starter', maxEmployees: 15 },
  business: { label: 'Business', maxEmployees: 50 },
  enterprise: { label: 'Enterprise', maxEmployees: 0 },
};

export const TRIAL_DAYS = 14;

const LICENSE_KEY = 'pp_license'; // stores the signed token
const TRIAL_KEY = 'pp_trial'; // stores { started: ISO }

/* --------------------------------------------------------------- base64url */

function b64urlToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToStr(s: string): string {
  return new TextDecoder().decode(b64urlToBytes(s));
}

/** Canonical string that gets signed — order/format must match the generator. */
export function canonicalString(p: LicensePayload): string {
  return `v1|${p.company}|${p.tier}|${p.maxEmployees}|${p.issued}|${p.expires}`;
}

let cachedKey: CryptoKey | null = null;
async function publicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    'jwk',
    LICENSE_PUBLIC_JWK,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  return cachedKey;
}

/** Verify a licence token's signature and return its payload, or null if invalid. */
export async function verifyToken(token: string): Promise<LicensePayload | null> {
  try {
    const [p, s] = token.trim().split('.');
    if (!p || !s) return null;
    const payload = JSON.parse(b64urlToStr(p)) as LicensePayload;
    const sig = b64urlToBytes(s);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      await publicKey(),
      sig as BufferSource,
      new TextEncoder().encode(canonicalString(payload)) as BufferSource,
    );
    return ok ? payload : null;
  } catch {
    return null;
  }
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function statusFromPayload(payload: LicensePayload, isTrial: boolean): LicenseStatus {
  const perpetual = !payload.expires;
  const left = perpetual ? null : daysUntil(payload.expires);
  const expired = left !== null && left <= 0;
  return {
    valid: !expired,
    payload,
    isTrial,
    expired,
    daysLeft: left,
    reason: expired ? 'expired' : undefined,
  };
}

/** Current licence/trial status. */
export async function getLicenseStatus(): Promise<LicenseStatus> {
  const token = localStorage.getItem(LICENSE_KEY);
  if (token) {
    const payload = await verifyToken(token);
    if (!payload) return { valid: false, payload: null, isTrial: false, expired: false, daysLeft: null, reason: 'invalid' };
    return statusFromPayload(payload, false);
  }

  const trialRaw = localStorage.getItem(TRIAL_KEY);
  if (trialRaw) {
    try {
      const { started } = JSON.parse(trialRaw) as { started: string };
      const expires = new Date(new Date(started).getTime() + TRIAL_DAYS * 86_400_000).toISOString();
      const payload: LicensePayload = {
        company: 'Trial user',
        tier: 'trial',
        maxEmployees: TIER_META.trial.maxEmployees,
        issued: started,
        expires,
      };
      return statusFromPayload(payload, true);
    } catch {
      /* fall through */
    }
  }

  return { valid: false, payload: null, isTrial: false, expired: false, daysLeft: null, reason: 'none' };
}

/** Activate a pasted licence key. Returns the resulting status. */
export async function activateLicense(token: string): Promise<LicenseStatus> {
  const payload = await verifyToken(token);
  if (!payload) {
    return { valid: false, payload: null, isTrial: false, expired: false, daysLeft: null, reason: 'invalid' };
  }
  const status = statusFromPayload(payload, false);
  if (!status.valid) return status; // expired key — don't store
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(TRIAL_KEY);
  return status;
}

/** Begin (or resume) the free trial. */
export async function startTrial(): Promise<LicenseStatus> {
  if (!localStorage.getItem(TRIAL_KEY)) {
    localStorage.setItem(TRIAL_KEY, JSON.stringify({ started: new Date().toISOString() }));
  }
  return getLicenseStatus();
}

/** Remove the stored licence (e.g. "deactivate this device"). Keeps app data. */
export function clearLicense(): void {
  localStorage.removeItem(LICENSE_KEY);
}

/** Effective active-employee cap for a status (0 = unlimited). */
export function employeeCap(status: LicenseStatus | null): number {
  return status?.payload?.maxEmployees ?? 0;
}

/* ------------------------------------------------------------------ pricing */

export const PRICE_CURRENCY = 'PGK';

export interface Plan {
  tier: Exclude<LicenseTier, 'trial'>;
  label: string;
  staff: string;
  price: number; // one-off, PGK (Kina)
}

/** Single source of truth for licence pricing (shown in-app). PGK for PNG bank-transfer sales. */
export const PLANS: Plan[] = [
  { tier: 'starter', label: 'Starter', staff: 'Up to 15 staff', price: 1500 },
  { tier: 'business', label: 'Business', staff: 'Up to 50 staff', price: 3000 },
  { tier: 'enterprise', label: 'Enterprise', staff: 'Unlimited staff', price: 9000 },
];

/** Optional annual updates & support plan (PGK/yr). */
export const ANNUAL_UPDATE_PRICE = 850;

/** "K 9,000" */
export function formatPrice(amount: number): string {
  return `K ${amount.toLocaleString('en-US')}`;
}

/**
 * Sales contact for manual purchase (bank transfer + emailed licence key).
 * CHANGE THIS to your business sales address if you don't want to use a personal one.
 */
export const SALES_EMAIL = 'ronflierl9@gmail.com';

/** Builds a pre-filled "I want to buy" email so a prospect can request a licence. */
export function purchaseMailto(opts?: { tier?: string; company?: string }): string {
  const subject = 'PNG Payroll Pro — Licence purchase';
  const planLine = opts?.tier ? `Plan: ${opts.tier}` : 'Plan: (Starter / Business / Enterprise)';
  const body = [
    'Hi,',
    '',
    "I'd like to purchase a PNG Payroll Pro licence.",
    '',
    `Company name: ${opts?.company ?? ''}`,
    planLine,
    '',
    'Please send your bank details and an invoice. Thanks!',
  ].join('\n');
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
