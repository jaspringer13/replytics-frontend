/**
 * Currency formatting utilities
 */

export interface CurrencyOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
}

/**
 * Format a number as currency
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, options: CurrencyOptions = {}): string {
  const {
    currency = 'USD',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    locale = 'en-US'
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Format currency with decimals (for precise amounts)
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string with 2 decimal places
 */
export function formatCurrencyWithDecimals(value: number, options: Omit<CurrencyOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {}): string {
  return formatCurrency(value, {
    ...options,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format currency as a compact representation (e.g., $1.2K, $1.5M)
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Compact formatted currency string
 */
export function formatCurrencyCompact(value: number, options: Omit<CurrencyOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {}): string {
  const {
    currency = 'USD',
    locale = 'en-US'
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value);
}