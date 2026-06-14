// lib/licenseKey.ts — Embedded PUBLIC key used to verify licences offline.
//
// This is safe to ship in the client bundle (public keys are not secret).
// The matching PRIVATE key lives only in scripts/keys/private.jwk.json (gitignored)
// and is used by scripts/license-gen.mjs to issue licences.
//
// Generated via: node scripts/license-keygen.mjs
export const LICENSE_PUBLIC_JWK: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: '-s2B0BYZao57OeSHjkh_DscDJPIJvDX3yhjdrdOEXTo',
  y: 'K1Y1DUhJXsgJ11IIxYtCsK5P28K45GirT3S800LyhK4',
};
