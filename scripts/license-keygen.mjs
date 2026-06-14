// scripts/license-keygen.mjs — ONE-TIME vendor keypair generator.
//
// Run once:  node scripts/license-keygen.mjs
//   - Saves the PRIVATE key to scripts/keys/private.jwk.json (gitignored — never share).
//   - Prints the PUBLIC key JWK to paste into src/lib/licenseKey.ts.
//
// The private key signs licences (see license-gen.mjs). The public key is embedded
// in the app to verify them offline. Keep the private key safe + backed up; if you
// lose it you can't issue compatible licences and must re-key (invalidating old ones).
import { webcrypto as crypto } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pair = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify'],
);

const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);

const keysDir = resolve(__dirname, 'keys');
await mkdir(keysDir, { recursive: true });
await writeFile(resolve(keysDir, 'private.jwk.json'), JSON.stringify(priv, null, 2));

console.log('\n✅ Private key saved to scripts/keys/private.jwk.json (keep secret, back it up).\n');
console.log('Paste this PUBLIC key into src/lib/licenseKey.ts as LICENSE_PUBLIC_JWK:\n');
console.log(JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, null, 2));
console.log('');
