// lib/tax/super.ts — Nasfund superannuation calculations
//
// PNG superannuation (Nasfund / Nambawan Super) statutory minimums:
//   - Employee contribution: 6% of gross
//   - Employer contribution: 8.4% of gross (paid by employer, not deducted)
// Rates are configurable in Settings in case statutory rates change.
import { round2 } from './swt';

/** Employee Nasfund deduction (default 6% of gross). Deducted from net pay. */
export function employeeSuper(gross: number, ratePct = 6): number {
  if (gross <= 0) return 0;
  return round2(gross * (ratePct / 100));
}

/**
 * Employer Nasfund contribution (default 8.4% of gross). NOT deducted from the
 * employee — it is an employer cost on top of gross.
 */
export function employerSuper(gross: number, ratePct = 8.4): number {
  if (gross <= 0) return 0;
  return round2(gross * (ratePct / 100));
}
