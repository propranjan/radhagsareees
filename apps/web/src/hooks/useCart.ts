'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useCart() {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  const addToCart = useCallback(async (
    productId: string,
    variantId: string,
    quantity: number = 1
  ) => {
    if (!supabase) {
      setError('Authentication not configured');
      return { success: false, error: 'Authentication not configured' };
    }

    setAdding(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please sign in to add items to cart');
        return { success: false, error: 'Please sign in to add items to cart', needsAuth: true };
      }

      const response = await fetch(`/api/cart/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const data = await response.json();
      
      // Trigger a custom event to update cart count in header
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAdding(false);
    }
  }, [supabase]);

  return {
    addToCart,
    adding,
    error,
  };
}
