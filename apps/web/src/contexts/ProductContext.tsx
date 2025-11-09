/**
 * Product Context - Eliminates product prop drilling
 */
'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface ProductContextData {
  id: string;
  name: string;
  category: string;
  price: number;
  variantInfo: string;
  images: string[];
  slug: string;
}

interface ProductState {
  product: ProductContextData | null;
  selectedVariant: any | null;
  selectedImageIndex: number;
  isLoading: boolean;
  error: string | null;
}

type ProductAction = 
  | { type: 'SET_PRODUCT'; payload: ProductContextData }
  | { type: 'SET_VARIANT'; payload: any }
  | { type: 'SET_IMAGE_INDEX'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: ProductState = {
  product: null,
  selectedVariant: null,
  selectedImageIndex: 0,
  isLoading: false,
  error: null,
};

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'SET_PRODUCT':
      return { ...state, product: action.payload };
    case 'SET_VARIANT':
      return { ...state, selectedVariant: action.payload };
    case 'SET_IMAGE_INDEX':
      return { ...state, selectedImageIndex: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface ProductContextValue extends ProductState {
  setProduct: (product: ProductContextData) => void;
  setVariant: (variant: any) => void;
  setImageIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ProductContext = createContext<ProductContextValue | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(productReducer, initialState);

  const setProduct = (product: ProductContextData) => {
    dispatch({ type: 'SET_PRODUCT', payload: product });
  };

  const setVariant = (variant: any) => {
    dispatch({ type: 'SET_VARIANT', payload: variant });
  };

  const setImageIndex = (index: number) => {
    dispatch({ type: 'SET_IMAGE_INDEX', payload: index });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const value: ProductContextValue = {
    ...state,
    setProduct,
    setVariant,
    setImageIndex,
    setLoading,
    setError,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}