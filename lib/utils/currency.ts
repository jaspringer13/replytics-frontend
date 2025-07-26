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

/**
 * Format currency for charts with manual K/M abbreviations (legacy behavior)
 * @param value - The number to format
 * @returns Formatted currency string with K/M abbreviations
 */
export function formatCurrencyForCharts(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '$0'
  
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  
  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(1)}M`
  } else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(1)}K`
  }
  return `${sign}$${absValue.toFixed(0)}`
}