// lib/tax/swt.ts — Salary & Wages Tax calculation engine
import {
  SWT_BRACKETS_FORTNIGHTLY_2025,
  FN_TAX_FREE_THRESHOLD,
  NO_TFN_RATE,
  type SWTBracket,
} from './brackets';
import type { PayPeriod } from '@/types';

/** Round to 2 decimal places using half-up (banker-safe for currency display). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Find the SWT bracket that contains the given fortnightly taxable income.
 */
export function findBracket(fortnightlyTaxable: number): SWTBracket {
  const brackets = SWT_BRACKETS_FORTNIGHTLY_2025;
  for (const b of brackets) {
    if (fortnightlyTaxable > b.min && fortnightlyTaxable <= b.max) return b;
  }
  // income at or below the tax-free floor
  return brackets[0];
}

/**
 * Calculate fortnightly Salary & Wages Tax (SWT) for PNG residents.
 *
 * @param fortnightlyGross fortnightly TAXABLE income (gross salary; most
 *   allowances are excluded per IRC and should not be passed here).
 * @returns SWT payable for the fortnight, rounded to 2dp. Returns 0 at or below
 *   the tax-free threshold (K769.23/fn = K20,000/yr).
 *
 * Formula: baseTax + (income - bracketMin) * marginalRate
 *
 * Unit-test references (current 2024/2025 schedule):
 *   calculateSWT(769.23) === 0           // tax-free floor
 *   calculateSWT(1000)   === 69.23       // 0 + (1000-769.23)*0.30
 *   calculateSWT(1269.23)=== 150.00      // band 2 ceiling
 *   calculateSWT(2500)   === 580.77      // 150 + (2500-1269.23)*0.35
 *   calculateSWT(4500)   === 1371.08     // 648.08 + (4500-2692.31)*0.40
 */
export function calculateSWT(fortnightlyGross: number): number {
  if (!Number.isFinite(fortnightlyGross) || fortnightlyGross <= FN_TAX_FREE_THRESHOLD) {
    return 0;
  }
  const bracket = findBracket(fortnightlyGross);
  const tax = bracket.baseTax + (fortnightlyGross - bracket.min) * bracket.marginalRate;
  return round2(Math.max(0, tax));
}

/**
 * SWT for an employee with NO Tax File Number lodged — taxed at the highest
 * marginal rate (42%) on the whole taxable amount, per the brief's edge-case rule.
 */
export function calculateSWTNoTFN(fortnightlyGross: number): number {
  if (!Number.isFinite(fortnightlyGross) || fortnightlyGross <= 0) return 0;
  return round2(fortnightlyGross * NO_TFN_RATE);
}

/** Human-readable bracket label for a fortnightly taxable income. */
export function getTaxBracketLabel(fortnightlyTaxable: number): string {
  if (fortnightlyTaxable <= FN_TAX_FREE_THRESHOLD) return 'Tax-free';
  return findBracket(fortnightlyTaxable).label;
}

/** Effective tax rate (%) = SWT / taxable income * 100. */
export function effectiveTaxRate(swt: number, taxable: number): number {
  if (taxable <= 0) return 0;
  return round2((swt / taxable) * 100);
}

/** Number of pay periods in a year. */
const PERIODS_PER_YEAR: Record<PayPeriod, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

/**
 * Convert a monetary amount between pay periods (via the annualised value).
 * e.g. convertPayPeriod(1000, 'fortnightly', 'monthly') => 2166.67
 */
export function convertPayPeriod(amount: number, from: PayPeriod, to: PayPeriod): number {
  if (from === to) return round2(amount);
  const annual = amount * PERIODS_PER_YEAR[from];
  return round2(annual / PERIODS_PER_YEAR[to]);
}
