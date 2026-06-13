// lib/tax/brackets.ts — IRC Salary & Wages Tax (SWT) bracket data
//
// SOURCE OF TRUTH: These are the CURRENT PNG resident SWT brackets following the
// 2024 National Budget, which made the K20,000 tax-free threshold permanent and
// removed the former 22% bracket.
//
// Authoritative references (verified June 2026):
//   - PwC Worldwide Tax Summaries — Papua New Guinea, Individual taxes on income
//   - IRC PNG — "Tax-Free Threshold increased is now permanent"
//
// Annual resident rate ladder:
//   0      – 20,000  : 0%   (tax-free threshold)
//   20,001 – 33,000  : 30%
//   33,001 – 70,000  : 35%
//   70,001 – 250,000 : 40%
//   250,001+         : 42%
//
// Fortnightly figures below are the annual figures divided by 26.
//
// NOTE: The original project brief shipped an OUTDATED bracket table that still
// contained a 22% band (pre-2023 structure). It has been corrected here. The
// brief's checklist figures for "K2,500 fortnightly -> SWT" (K288.18 / K399.18)
// were both incorrect; the correct value under the current schedule is K580.77.

export interface SWTBracket {
  /** Inclusive lower bound of fortnightly taxable income (PGK). */
  min: number;
  /** Upper bound of fortnightly taxable income (PGK). Use Infinity for the top band. */
  max: number;
  /** Cumulative tax payable at `min` for this band (PGK, fortnightly). */
  baseTax: number;
  /** Marginal rate applied to income in excess of `min`. */
  marginalRate: number;
  /** Human-readable band label. */
  label: string;
}

/** Fortnight-equivalent boundaries derived from the annual ladder (÷26). */
export const FN_TAX_FREE_THRESHOLD = 20000 / 26; // 769.2307...
const FN_33K = 33000 / 26; // 1269.2307...
const FN_70K = 70000 / 26; // 2692.3076...
const FN_250K = 250000 / 26; // 9615.3846...

/** Base tax (cumulative) at each band boundary, fortnightly (÷26). */
const BASE_30 = 0; // tax at 769.23
const BASE_35 = 3900 / 26; // = 150.00 (tax at 1269.23)
const BASE_40 = 16850 / 26; // = 648.0769... (tax at 2692.31)
const BASE_42 = 88850 / 26; // = 3417.3076... (tax at 9615.38)

export const SWT_BRACKETS_FORTNIGHTLY_2025: SWTBracket[] = [
  { min: 0, max: FN_TAX_FREE_THRESHOLD, baseTax: 0, marginalRate: 0.0, label: 'Tax-free' },
  { min: FN_TAX_FREE_THRESHOLD, max: FN_33K, baseTax: BASE_30, marginalRate: 0.3, label: '30% band' },
  { min: FN_33K, max: FN_70K, baseTax: BASE_35, marginalRate: 0.35, label: '35% band' },
  { min: FN_70K, max: FN_250K, baseTax: BASE_40, marginalRate: 0.4, label: '40% band' },
  { min: FN_250K, max: Infinity, baseTax: BASE_42, marginalRate: 0.42, label: '42% band' },
];

/** Highest marginal rate — applied to employees with no TFN lodged. */
export const NO_TFN_RATE = 0.42;

/** Annual ladder, kept for reference / reporting. */
export const SWT_ANNUAL_2025 = [
  { min: 0, max: 20000, rate: 0.0 },
  { min: 20000, max: 33000, rate: 0.3 },
  { min: 33000, max: 70000, rate: 0.35 },
  { min: 70000, max: 250000, rate: 0.4 },
  { min: 250000, max: Infinity, rate: 0.42 },
];
