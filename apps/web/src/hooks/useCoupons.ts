/**
 * React hooks for coupon management and validation
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  CouponService,
  createCouponService,
  type Coupon,
  type CouponApplication,
  type CartSummary,
  type CouponValidationResult,
} from '../lib/coupons';
import { usePrice } from './usePrice';

/**
 * Hook for managing coupon state and operations
 */
export function useCoupons() {
  const [couponService] = useState(() => createCouponService());
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplication | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available coupons for user
  const loadAvailableCoupons = useCallback((userId?: string, isNewUser = false) => {
    const coupons = couponService.getAvailableCoupons(userId, isNewUser);
    setAvailableCoupons(coupons);
  }, [couponService]);

  // Validate coupon code
  const validateCoupon = useCallback((
    code: string,
    cart: CartSummary
  ): CouponValidationResult => {
    return couponService.validateCoupon(code, cart);
  }, [couponService]);

  // Apply coupon
  const applyCoupon = useCallback(async (
    code: string,
    cart: CartSummary
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const application = couponService.applyCoupon(code, cart);
      
      if (application) {
        setAppliedCoupon(application);
        return true;
      } else {
        const validation = validateCoupon(code, cart);
        setError(validation.error || 'Failed to apply coupon');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply coupon');
      return false;
    } finally {
      setLoading(false);
    }
  }, [couponService, validateCoupon]);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
  }, []);

  // Mark coupon as used (call this after successful order)
  const markCouponUsed = useCallback((userId?: string) => {
    if (appliedCoupon) {
      couponService.markCouponUsed(appliedCoupon.coupon.code, userId);
      setAppliedCoupon(null);
    }
  }, [couponService, appliedCoupon]);

  return {
    appliedCoupon,
    availableCoupons,
    loading,
    error,
    loadAvailableCoupons,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    markCouponUsed,
  };
}

/**
 * Hook for coupon input with real-time validation
 */
export function useCouponInput(cart: CartSummary) {
  const [code, setCode] = useState('');
  const [validationResult, setValidationResult] = useState<CouponValidationResult | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const { validateCoupon } = useCoupons();

  // Debounced validation
  const validateCode = useCallback((inputCode: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!inputCode.trim()) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = validateCoupon(inputCode, cart);
      setValidationResult(result);
    }, 500);

    setDebounceTimer(timer);
  }, [validateCoupon, cart, debounceTimer]);

  // Handle code change
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    validateCode(newCode);
  }, [validateCode]);

  // Clear validation
  const clearValidation = useCallback(() => {
    setValidationResult(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [debounceTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    code,
    setCode: handleCodeChange,
    validationResult,
    clearValidation,
    isValid: validationResult?.isValid || false,
    error: validationResult?.error,
  };
}

/**
 * Hook for displaying coupon savings and benefits
 */
export function useCouponDisplay() {
  const { price, percentage } = usePrice();

  const formatCouponDiscount = useCallback((coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.discountValue}% OFF`;
      case 'flat':
        return `${price(coupon.discountValue)} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      case 'buy_x_get_y':
        return `BUY ${coupon.buyQuantity} GET ${coupon.getQuantity}`;
      default:
        return 'DISCOUNT';
    }
  }, [price]);

  const formatCouponSavings = useCallback((application: CouponApplication) => {
    if (application.freeShipping && application.discountAmount > 0) {
      return `Save ${price(application.discountAmount)} + Free Shipping`;
    } else if (application.freeShipping) {
      return 'Free Shipping Applied';
    } else {
      return `Save ${price(application.discountAmount)}`;
    }
  }, [price]);

  const formatMinOrderValue = useCallback((minOrderValue?: number) => {
    return minOrderValue ? `Min. order ${price(minOrderValue)}` : null;
  }, [price]);

  const formatMaxDiscount = useCallback((maxDiscount?: number) => {
    return maxDiscount ? `Max. discount ${price(maxDiscount)}` : null;
  }, [price]);

  const formatValidUntil = useCallback((date: Date) => {
    return `Valid until ${date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;
  }, []);

  return {
    formatCouponDiscount,
    formatCouponSavings,
    formatMinOrderValue,
    formatMaxDiscount,
    formatValidUntil,
  };
}

/**
 * Hook for cart totals with coupon applied
 */
export function useCartWithCoupon(cart: CartSummary, appliedCoupon?: CouponApplication | null) {
  const { price } = usePrice();

  const totals = useMemo(() => {
    const subtotal = cart.subtotal;
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const freeShipping = appliedCoupon?.freeShipping || false;
    
    // Calculate shipping (simplified - you might want to use the shipping hook)
    let shippingCharges = 0;
    if (!freeShipping && subtotal < 999) {
      shippingCharges = 50; // Standard shipping
    }
    
    // Calculate tax (18% GST)
    const taxableAmount = subtotal - discountAmount;
    const tax = Math.round(taxableAmount * 0.18 * 100) / 100;
    
    const total = taxableAmount + tax + shippingCharges;
    const savings = discountAmount + (freeShipping && subtotal < 999 ? 50 : 0);

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      tax,
      shippingCharges,
      total,
      savings,
      freeShipping,
    };
  }, [cart.subtotal, appliedCoupon]);

  const formattedTotals = useMemo(() => ({
    subtotal: price(totals.subtotal),
    discount: totals.discountAmount > 0 ? `-${price(totals.discountAmount)}` : null,
    taxableAmount: price(totals.taxableAmount),
    tax: price(totals.tax),
    shipping: totals.shippingCharges > 0 ? price(totals.shippingCharges) : 'Free',
    total: price(totals.total),
    savings: totals.savings > 0 ? price(totals.savings) : null,
  }), [totals, price]);

  return {
    totals,
    formattedTotals,
    hasCoupon: !!appliedCoupon,
    couponMessage: appliedCoupon?.message,
  };
}

/**
 * Hook for best coupon suggestion
 */
export function useBestCouponSuggestion(cart: CartSummary, userId?: string, isNewUser = false) {
  const { applyCoupon } = useCoupons();
  const [bestCoupon, setBestCoupon] = useState<CouponApplication | null>(null);

  const findBestCoupon = useCallback(async () => {
    const couponService = createCouponService();
    const availableCoupons = couponService.getAvailableCoupons(userId, isNewUser);
    
    let bestSavings = 0;
    let bestApplication: CouponApplication | null = null;

    for (const coupon of availableCoupons) {
      const application = couponService.applyCoupon(coupon.code, cart);
      if (application) {
        const totalSavings = application.discountAmount + 
          (application.freeShipping && cart.subtotal < 999 ? 50 : 0);
        
        if (totalSavings > bestSavings) {
          bestSavings = totalSavings;
          bestApplication = application;
        }
      }
    }

    setBestCoupon(bestApplication);
  }, [cart, userId, isNewUser]);

  useEffect(() => {
    if (cart.items.length > 0) {
      findBestCoupon();
    }
  }, [cart.items.length, findBestCoupon]);

  return {
    bestCoupon,
    hasSuggestion: !!bestCoupon,
    refresh: findBestCoupon,
  };
}