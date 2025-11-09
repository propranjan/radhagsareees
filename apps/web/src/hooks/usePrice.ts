/**
 * React hooks for price formatting and internationalization
 */

import { useLocale, useFormatter } from 'next-intl';
import { useMemo, useCallback } from 'react';
import { 
  formatPrice, 
  formatPriceRange, 
  formatDiscountedPrice,
  PriceFormatter,
  type PriceOptions,
  type DiscountInfo,
  calculateDiscount,
  calculateTax,
  calculateShippingCharges,
} from '../lib/price';
import { type Locale } from '../i18n/config';

/**
 * Hook for price formatting with current locale
 */
export function usePrice() {
  const locale = useLocale() as Locale;
  const format = useFormatter();

  const formatters = useMemo(() => ({
    // Basic price formatting
    price: (amount: number, options?: PriceOptions) => 
      formatPrice(amount, { locale, ...options }),
    
    // Price range formatting
    priceRange: (min: number, max: number, options?: PriceOptions) => 
      formatPriceRange(min, max, { locale, ...options }),
    
    // Context-specific formatters
    listing: (price: number) => PriceFormatter.listing(price, { locale }),
    detail: (price: number) => PriceFormatter.detail(price, { locale }),
    cart: (price: number) => PriceFormatter.cart(price, { locale }),
    total: (price: number) => PriceFormatter.total(price, { locale }),
    
    // Discount formatting
    discounted: (original: number, discounted: number, options?: PriceOptions) =>
      formatDiscountedPrice(original, discounted, { locale, ...options }),
    
    // Currency formatting using next-intl
    currency: (amount: number) => format.number(amount, 'currency'),
    
    // Percentage formatting
    percentage: (value: number) => format.number(value / 100, 'percent'),
  }), [locale, format]);

  return formatters;
}

/**
 * Hook for discount calculations
 */
export function useDiscount() {
  const { discounted } = usePrice();

  const calculate = useCallback((originalPrice: number, discountedPrice: number): DiscountInfo => {
    return calculateDiscount(originalPrice, discountedPrice);
  }, []);

  const format = useCallback((originalPrice: number, discountedPrice: number) => {
    return discounted(originalPrice, discountedPrice);
  }, [discounted]);

  return {
    calculate,
    format,
  };
}

/**
 * Hook for tax calculations
 */
export function useTax() {
  const { price } = usePrice();

  const calculate = useCallback((amount: number) => {
    return calculateTax(amount);
  }, []);

  const format = useCallback((amount: number) => {
    const tax = calculate(amount);
    return {
      gst: price(tax.gst),
      luxuryTax: price(tax.luxuryTax), 
      total: price(tax.total),
      formatted: {
        gst: `GST (18%): ${price(tax.gst)}`,
        luxuryTax: tax.luxuryTax > 0 ? `Luxury Tax (3%): ${price(tax.luxuryTax)}` : null,
        total: `Total Tax: ${price(tax.total)}`,
      }
    };
  }, [calculate, price]);

  return {
    calculate,
    format,
  };
}

/**
 * Hook for shipping calculations
 */
export function useShipping() {
  const { price } = usePrice();

  const calculate = useCallback((orderValue: number, isExpress = false, isCOD = false) => {
    return calculateShippingCharges(orderValue, isExpress, isCOD);
  }, []);

  const format = useCallback((orderValue: number, isExpress = false, isCOD = false) => {
    const shipping = calculate(orderValue, isExpress, isCOD);
    return {
      shipping: price(shipping.shippingCharges),
      cod: price(shipping.codCharges),
      total: price(shipping.total),
      formatted: {
        shipping: shipping.shippingCharges > 0 
          ? `Shipping: ${price(shipping.shippingCharges)}`
          : 'Free Shipping',
        cod: shipping.codCharges > 0 
          ? `COD Charges: ${price(shipping.codCharges)}`
          : null,
        total: shipping.total > 0 
          ? `Total Charges: ${price(shipping.total)}`
          : 'No additional charges',
      }
    };
  }, [calculate, price]);

  return {
    calculate,
    format,
  };
}

/**
 * Hook for order summary calculations
 */
export function useOrderSummary() {
  const { price } = usePrice();
  const tax = useTax();
  const shipping = useShipping();

  const calculate = useCallback((
    subtotal: number,
    discountAmount: number = 0,
    isExpress: boolean = false,
    isCOD: boolean = false,
    freeShipping: boolean = false
  ) => {
    const discountedSubtotal = subtotal - discountAmount;
    const taxes = tax.calculate(discountedSubtotal);
    const shippingCharges = freeShipping 
      ? { shippingCharges: 0, codCharges: isCOD ? 49 : 0, total: isCOD ? 49 : 0 }
      : shipping.calculate(discountedSubtotal, isExpress, isCOD);
    
    const total = discountedSubtotal + taxes.total + shippingCharges.total;

    return {
      subtotal,
      discount: discountAmount,
      discountedSubtotal,
      tax: taxes,
      shipping: shippingCharges,
      total,
      savings: discountAmount + (freeShipping && subtotal < 999 ? 50 : 0), // Include shipping savings
    };
  }, [tax, shipping]);

  const format = useCallback((
    subtotal: number,
    discountAmount: number = 0,
    isExpress: boolean = false,
    isCOD: boolean = false,
    freeShipping: boolean = false
  ) => {
    const summary = calculate(subtotal, discountAmount, isExpress, isCOD, freeShipping);
    
    return {
      ...summary,
      formatted: {
        subtotal: price(summary.subtotal),
        discount: summary.discount > 0 ? `-${price(summary.discount)}` : null,
        discountedSubtotal: price(summary.discountedSubtotal),
        tax: tax.format(summary.discountedSubtotal),
        shipping: shipping.format(summary.discountedSubtotal, isExpress, isCOD),
        total: price(summary.total),
        savings: summary.savings > 0 ? `You saved ${price(summary.savings)}!` : null,
      }
    };
  }, [calculate, price, tax, shipping]);

  return {
    calculate,
    format,
  };
}

/**
 * Hook for price comparison and filters
 */
export function usePriceFilter() {
  const { price } = usePrice();

  const formatRange = useCallback((min?: number, max?: number) => {
    if (!min && !max) return 'All Prices';
    if (!min) return `Under ${price(max!)}`;
    if (!max) return `${price(min)} & Above`;
    return `${price(min)} - ${price(max)}`;
  }, [price]);

  const isInRange = useCallback((itemPrice: number, min?: number, max?: number) => {
    if (min !== undefined && itemPrice < min) return false;
    if (max !== undefined && itemPrice > max) return false;
    return true;
  }, []);

  const sortPrices = useCallback((items: Array<{ price: number }>, direction: 'asc' | 'desc' = 'asc') => {
    return [...items].sort((a, b) => 
      direction === 'asc' ? a.price - b.price : b.price - a.price
    );
  }, []);

  return {
    formatRange,
    isInRange,
    sortPrices,
  };
}