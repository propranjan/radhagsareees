/**
 * Price Formatting Utilities for Indian Market
 * Handles INR currency formatting with proper locale support
 */

import { type Locale, getCurrency, getCurrencySymbol, getLocaleConfig } from '../i18n/config';

export interface PriceOptions {
  locale?: Locale;
  showSymbol?: boolean;
  showDecimals?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DiscountInfo {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  discountAmount: number;
}

/**
 * Format price with proper Indian locale formatting
 */
export function formatPrice(
  amount: number,
  options: PriceOptions = {}
): string {
  const {
    locale = 'en-IN',
    showSymbol = true,
    showDecimals = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  const config = getLocaleConfig(locale);
  
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: config.currency,
    minimumFractionDigits: showDecimals ? minimumFractionDigits : 0,
    maximumFractionDigits: showDecimals ? maximumFractionDigits : 0,
    currencyDisplay: 'symbol',
  });

  return formatter.format(amount);
}

/**
 * Format price range (from X to Y)
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  options: PriceOptions = {}
): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice, options);
  }
  
  return `${formatPrice(minPrice, options)} - ${formatPrice(maxPrice, options)}`;
}

/**
 * Calculate and format discount information
 */
export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number
): DiscountInfo {
  const discountAmount = originalPrice - discountedPrice;
  const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
  
  return {
    originalPrice,
    discountedPrice,
    discountPercentage,
    discountAmount,
  };
}

/**
 * Format discount percentage
 */
export function formatDiscountPercentage(percentage: number): string {
  return `${Math.round(percentage)}% off`;
}

/**
 * Format discount amount
 */
export function formatDiscountAmount(
  amount: number,
  options: PriceOptions = {}
): string {
  return `Save ${formatPrice(amount, options)}`;
}

/**
 * Format price with strikethrough original price and discount
 */
export function formatDiscountedPrice(
  originalPrice: number,
  discountedPrice: number,
  options: PriceOptions = {}
): {
  original: string;
  discounted: string;
  discount: string;
  savings: string;
} {
  const discount = calculateDiscount(originalPrice, discountedPrice);
  
  return {
    original: formatPrice(originalPrice, options),
    discounted: formatPrice(discountedPrice, options),
    discount: formatDiscountPercentage(discount.discountPercentage),
    savings: formatDiscountAmount(discount.discountAmount, options),
  };
}

/**
 * Parse price string to number (remove currency symbols and formatting)
 */
export function parsePrice(priceString: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = priceString.replace(/[₹$,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Compare prices for sorting
 */
export function comparePrices(a: number, b: number): number {
  return a - b;
}

/**
 * Check if price is within range
 */
export function isPriceInRange(
  price: number,
  minPrice?: number,
  maxPrice?: number
): boolean {
  if (minPrice !== undefined && price < minPrice) return false;
  if (maxPrice !== undefined && price > maxPrice) return false;
  return true;
}

/**
 * Format price for different contexts
 */
export const PriceFormatter = {
  /**
   * Product listing price (compact format)
   */
  listing: (price: number, options?: PriceOptions) =>
    formatPrice(price, { ...options, maximumFractionDigits: 0 }),

  /**
   * Product detail price (full format)
   */
  detail: (price: number, options?: PriceOptions) =>
    formatPrice(price, { ...options, minimumFractionDigits: 2 }),

  /**
   * Cart/checkout price (precise format)
   */
  cart: (price: number, options?: PriceOptions) =>
    formatPrice(price, { ...options, minimumFractionDigits: 2, maximumFractionDigits: 2 }),

  /**
   * Summary total (bold format)
   */
  total: (price: number, options?: PriceOptions) =>
    formatPrice(price, { ...options, minimumFractionDigits: 2 }),
};

/**
 * Price constants for Indian market
 */
export const PriceConfig = {
  MIN_ORDER_VALUE: 500, // ₹500 minimum order
  FREE_SHIPPING_THRESHOLD: 999, // Free shipping above ₹999
  COD_CHARGES: 49, // ₹49 COD charges
  EXPRESS_DELIVERY_CHARGES: 99, // ₹99 express delivery
  
  // Tax rates
  GST_RATE: 0.18, // 18% GST
  LUXURY_TAX_THRESHOLD: 10000, // Luxury tax above ₹10,000
  LUXURY_TAX_RATE: 0.03, // 3% luxury tax
} as const;

/**
 * Calculate taxes for Indian market
 */
export function calculateTax(amount: number): {
  gst: number;
  luxuryTax: number;
  total: number;
} {
  const gst = amount * PriceConfig.GST_RATE;
  const luxuryTax = amount > PriceConfig.LUXURY_TAX_THRESHOLD 
    ? amount * PriceConfig.LUXURY_TAX_RATE 
    : 0;
  
  return {
    gst,
    luxuryTax,
    total: gst + luxuryTax,
  };
}

/**
 * Calculate shipping charges
 */
export function calculateShippingCharges(
  orderValue: number,
  isExpress: boolean = false,
  isCOD: boolean = false
): {
  shippingCharges: number;
  codCharges: number;
  total: number;
} {
  let shippingCharges = 0;
  
  // Free shipping above threshold
  if (orderValue < PriceConfig.FREE_SHIPPING_THRESHOLD) {
    shippingCharges = isExpress 
      ? PriceConfig.EXPRESS_DELIVERY_CHARGES 
      : 50; // Standard shipping
  } else if (isExpress) {
    // Express charges even for free shipping eligible orders
    shippingCharges = PriceConfig.EXPRESS_DELIVERY_CHARGES;
  }
  
  const codCharges = isCOD ? PriceConfig.COD_CHARGES : 0;
  
  return {
    shippingCharges,
    codCharges,
    total: shippingCharges + codCharges,
  };
}