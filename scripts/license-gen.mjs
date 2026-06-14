// scripts/license-gen.mjs — Issue a signed licence key for a buyer.
//
// Examples:
//   node scripts/license-gen.mjs --company "Acme Trading Ltd" --tier business
//   node scripts/license-gen.mjs --company "Big Co" --tier enterprise
//   node scripts/license-gen.mjs --company "Pilot Co" --tier starter --days 365
//
// Tiers: starter (15 staff) | business (50) | enterprise (unlimited)
// Default expiry is perpetual; pass --days N or --years N for a time-limited key.
// Copy the printed LICENCE KEY to the buyer (Lemon Squeezy can auto-deliver it,
// or paste it into your invoice email).
import { webcrypto as crypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TIER_CAP = { trial: 5, starter: 15, business: 50, enterprise: 0 };

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const company = arg('company');
const tier = arg('tier', 'business');
const days = arg('days');
const years = arg('years');

if (!company || TIER_CAP[tier] === undefined) {
  console.error('Usage: node scripts/license-gen.mjs --company "Name" --tier starter|business|enterprise [--days N | --years N]');
  process.exit(1);
}

let expires = '';
if (days || years) {
  const n = days ? Number(days) : Number(years) * 365;
  expires = new Date(Date.now() + n * 86_400_000).toISOString();
}

const payload = {
  company,
  tier,
  maxEmployees: TIER_CAP[tier],
  issued: new Date().toISOString(),
  expires,
};

const canonical = `v1|${payload.company}|${payload.tier}|${payload.maxEmployees}|${payload.issued}|${payload.expires}`;

const b64url = (bytes) =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const privJwk = JSON.parse(await readFile(resolve(__dirname, 'keys/private.jwk.json'), 'utf8'));
const key = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(canonical));

const token = `${b64url(Buffer.from(JSON.stringify(payload)))}.${b64url(new Uint8Array(sig))}`;

console.log('\n──────────────────────────────────────────────');
console.log(`Company : ${company}`);
console.log(`Tier    : ${tier} (${TIER_CAP[tier] === 0 ? 'unlimited' : TIER_CAP[tier]} staff)`);
console.log(`Expires : ${expires || 'perpetual'}`);
console.log('──────────────────────────────────────────────');
console.log('\nLICENCE KEY (send this to the buyer):\n');
console.log(token);
console.log('');
