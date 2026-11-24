/**
 * Currency utilities to handle money calculations without floating point errors.
 * Uses integer representation internally (minor units) but works with Decimal strings.
 */

export const DEFAULT_DECIMAL_PLACES = 2;

/**
 * Parse a decimal string to integer minor units (cents)
 */
export function toMinorUnits(amount: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): bigint {
  const str = amount.toString();
  const [whole, fraction = ''] = str.split('.');
  const paddedFraction = fraction.padEnd(decimalPlaces, '0').slice(0, decimalPlaces);
  return BigInt(whole) * BigInt(10 ** decimalPlaces) + BigInt(paddedFraction);
}

/**
 * Convert integer minor units back to decimal string
 */
export function fromMinorUnits(minorUnits: bigint, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  const major = minorUnits / BigInt(10 ** decimalPlaces);
  const minor = minorUnits % BigInt(10 ** decimalPlaces);
  const minorStr = Math.abs(Number(minor)).toString().padStart(decimalPlaces, '0');
  return `${major}.${minorStr}`;
}

/**
 * Add two decimal amounts
 */
export function add(a: string | number, b: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  const aMinor = toMinorUnits(a, decimalPlaces);
  const bMinor = toMinorUnits(b, decimalPlaces);
  return fromMinorUnits(aMinor + bMinor, decimalPlaces);
}

/**
 * Subtract two decimal amounts
 */
export function subtract(a: string | number, b: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  const aMinor = toMinorUnits(a, decimalPlaces);
  const bMinor = toMinorUnits(b, decimalPlaces);
  return fromMinorUnits(aMinor - bMinor, decimalPlaces);
}

/**
 * Multiply a decimal amount by a factor (for percentages, etc.)
 */
export function multiply(amount: string | number, factor: number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  const amountMinor = toMinorUnits(amount, decimalPlaces);
  const resultMinor = BigInt(Math.round(Number(amountMinor) * factor));
  return fromMinorUnits(resultMinor, decimalPlaces);
}

/**
 * Calculate discount amount from percentage
 */
export function calculateDiscount(amount: string | number, discountPercent: number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  return multiply(amount, discountPercent / 100, decimalPlaces);
}

/**
 * Round a decimal amount to the specified number of decimal places
 */
export function round(amount: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  return num.toFixed(decimalPlaces);
}

/**
 * Compare two decimal amounts (returns -1, 0, or 1)
 */
export function compare(a: string | number, b: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): number {
  const aMinor = toMinorUnits(a, decimalPlaces);
  const bMinor = toMinorUnits(b, decimalPlaces);
  if (aMinor < bMinor) return -1;
  if (aMinor > bMinor) return 1;
  return 0;
}

/**
 * Check if amount is positive
 */
export function isPositive(amount: string | number, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): boolean {
  return compare(amount, '0', decimalPlaces) > 0;
}