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
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

Built with [Claude Code](https://claude.com/claude-code).
