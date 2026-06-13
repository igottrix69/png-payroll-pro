// lib/pin.ts — PIN hashing & verification via Web Crypto (SHA-256)

/** SHA-256 hex digest of a string using the Web Crypto API. */
export async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Hash a 4-digit PIN (with a fixed app salt to avoid trivial rainbow lookups). */
export async function hashPin(pin: string): Promise<string> {
  return sha256(`png-payroll-pro::${pin}`);
}

/** Verify a PIN against a stored hash. */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const h = await hashPin(pin);
  return h === storedHash;
}

/** The default PIN used on first run / after a reset. */
export const DEFAULT_PIN = '0000';
