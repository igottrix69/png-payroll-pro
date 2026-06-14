# PNG Payroll Pro

IRC-compliant **Salary & Wages Tax (SWT)** payroll management for Papua New Guinea
businesses. Manage employees, run fortnightly payroll, generate payslip PDFs, and
produce IRC remittance & reporting exports — all in a polished, dark, enterprise UI.

> **Demo PIN: `0000`** — change it in **Settings → Security PIN** after first login.

## Features

- **PIN-locked** entry (SHA-256 hashed via Web Crypto), keypad UI, 5-attempt lockout.
- **Dashboard** — KPIs, 12-period payroll trend, recent runs, compliance alerts.
- **Employees** — searchable/filterable table, add/edit with a **live payslip preview**.
- **Run Payroll** — 4-step wizard (period → select staff → review → confirm) with
  per-run one-off adjustments (bonus, loan recovery, gross override for casuals).
- **Payslips** — on-screen viewer + **PDF generation** (single or all-in-one).
- **IRC Reports** — Monthly SWT remittance, annual Group Tax Certificate, audit
  ledger and department-cost report, all exportable to **Excel**.
- **Leave management** — annual/sick balance tracking with liability alerts.
- **Settings** — company profile + logo, PIN change, configurable Nasfund rates,
  JSON backup/restore, full data reset.
- **localStorage persistence** behind a clean storage abstraction (drop in a backend later).

## Tax engine (verified June 2026)

SWT uses the **current PNG IRC resident fortnightly schedule** (post-2024 Budget,
which made the K20,000 tax-free threshold permanent and **removed the old 22% band**):

| Annual income (PGK) | Marginal rate |
| --- | --- |
| 0 – 20,000 | 0% (tax-free) |
| 20,001 – 33,000 | 30% |
| 33,001 – 70,000 | 35% |
| 70,001 – 250,000 | 40% |
| 250,001+ | 42% |

- Fortnightly figures = annual ÷ 26. Example: **K2,500/fn → SWT K580.77** (35% band).
- Employees **without a TFN** are taxed at the maximum **42%** rate.
- Nasfund: **6%** employee deduction, **8.4%** employer contribution (configurable).
- IRC SWT remittance is treated as due on the **7th** of the following month.

## Tech stack

React 19 · Vite · TypeScript (strict) · Tailwind CSS v4 · Zustand · Recharts ·
TanStack Table · jsPDF + AutoTable · SheetJS · date-fns · React Router · react-hot-toast.

## Develop

```bash
npm install
npm run dev          # web dev server, http://localhost:5173
npm run build        # type-check + production build to dist/
npm run electron:dev # run inside the Electron desktop shell
```

## Desktop app (sellable installer)

The app ships as a Windows desktop app via Electron — a single installer your
customers double-click. It runs fully offline; payroll data stays on their PC.

```bash
npm run dist     # builds dist/ then a Windows installer in release/
```

The output is `release/PNG Payroll Pro Setup <version>.exe`. (A branded `.ico`
can be added at `build-assets/icon.ico` and referenced under `build.win.icon` in
package.json; without it the default Electron icon is used.)

## Licensing (how you sell it)

The app is gated behind an **offline, signed licence** so a buyer can't freely
share it. Flow: **Activate screen → PIN → app**. New users can also start a
**14-day trial** (capped at 5 staff).

**One-time setup (already done):** `node scripts/license-keygen.mjs` created an
ECDSA keypair. The private key lives in `scripts/keys/private.jwk.json`
(**git-ignored — keep it secret and backed up**); the public key is embedded in
`src/lib/licenseKey.ts` and ships in the app to verify keys offline.

**Issue a licence for a buyer:**

```bash
node scripts/license-gen.mjs --company "Acme Trading Ltd" --tier business
# tiers: starter (15 staff) | business (50) | enterprise (unlimited)
# optional: --years 1  or  --days 365  for a time-limited key
```

It prints a licence key — email it to the buyer (or let Lemon Squeezy auto-deliver
it). They paste it into the Activate screen. The key encodes company + tier +
staff cap + expiry and is signature-verified; the staff cap is enforced in-app.

> ⚠️ Client-side licensing deters casual copying — it is not unbreakable DRM.
> Set your real checkout URL in `BUY_URL` (`src/lib/license.ts`).

## Selling checklist

1. Take the free public web demo down (or leave it as a capped trial) so it doesn't undercut paid sales.
2. Pick a paywall: **Lemon Squeezy / Paddle** (accept Visa/Mastercard, auto-deliver the installer + licence key, handle tax, pay out via Wise/Payoneer) — Stripe/PayPal direct may not support PNG-based merchants.
3. Price (one-off perpetual): **Starter $350 / Business $700 / Enterprise $1,400 USD**, plus optional **$250/yr** updates & support. Edit these in `PLANS` / `ANNUAL_UPDATE_PRICE` (`src/lib/license.ts`).
4. On each sale: run `license-gen`, send installer + key.

Built with [Claude Code](https://claude.com/claude-code).
