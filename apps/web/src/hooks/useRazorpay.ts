'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
    confirm_close?: boolean;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id?: string;
  };
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Hook to load and use Razorpay checkout
 */
export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    // Check if already loaded
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    setIsLoading(true);

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Failed to load Razorpay checkout');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup as other components might need it
    };
  }, []);

  /**
   * Open Razorpay checkout modal
   */
  const openCheckout = useCallback((options: RazorpayOptions) => {
    if (!isLoaded) {
      throw new Error('Razorpay not loaded yet');
    }

    const razorpay = new window.Razorpay(options);
    
    razorpay.on('payment.failed', (response: { error: RazorpayError }) => {
      console.error('Payment failed:', response.error);
    });

    razorpay.open();
    
    return razorpay;
  }, [isLoaded]);

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
  };
}

/**
 * Create Razorpay order via API
 */
export async function createRazorpayOrderAPI(data: {
  userId: string;
  shippingAddressId: string;
  items: Array<{
    variantId: string;
    productId: string;
    quantity: number;
    price: number;
  }>;
}) {
  const response = await fetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create order');
  }

  return result;
}

/**
 * Verify Razorpay payment via API
 */
export async function verifyRazorpayPaymentAPI(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}) {
  const response = await fetch('/api/razorpay/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Payment verification failed');
  }

  return result;
}
