/**
 * Try-On Context - Centralizes try-on state management
 */
'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CapturedImage {
  id: string;
  imageDataUrl: string;
  qualityScore: number;
  timestamp: string;
  productInfo?: {
    name: string;
    variant: string;
    garmentUrl: string;
  };
}

interface TryOnState {
  isModalOpen: boolean;
  isProcessing: boolean;
  capturedImages: CapturedImage[];
  currentCapture: CapturedImage | null;
  mlLibrariesLoaded: boolean;
  isMLLoading: boolean;
  mlError: string | null;
  settings: Record<string, any>;
}

type TryOnAction = 
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'ADD_CAPTURE'; payload: CapturedImage }
  | { type: 'SET_CURRENT_CAPTURE'; payload: CapturedImage | null }
  | { type: 'SET_ML_LIBRARIES_LOADED'; payload: boolean }
  | { type: 'SET_ML_LOADING'; payload: boolean }
  | { type: 'SET_ML_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Record<string, any> }
  | { type: 'CLEAR_CAPTURES' };

const initialState: TryOnState = {
  isModalOpen: false,
  isProcessing: false,
  capturedImages: [],
  currentCapture: null,
  mlLibrariesLoaded: false,
  isMLLoading: false,
  mlError: null,
  settings: {},
};

function tryOnReducer(state: TryOnState, action: TryOnAction): TryOnState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true };
    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'ADD_CAPTURE':
      return { 
        ...state, 
        capturedImages: [action.payload, ...state.capturedImages],
        currentCapture: action.payload 
      };
    case 'SET_CURRENT_CAPTURE':
      return { ...state, currentCapture: action.payload };
    case 'SET_ML_LIBRARIES_LOADED':
      return { ...state, mlLibrariesLoaded: action.payload };
    case 'SET_ML_LOADING':
      return { ...state, isMLLoading: action.payload };
    case 'SET_ML_ERROR':
      return { ...state, mlError: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'CLEAR_CAPTURES':
      return { ...state, capturedImages: [], currentCapture: null };
    default:
      return state;
  }
}

interface TryOnContextValue extends TryOnState {
  openModal: () => void;
  closeModal: () => void;
  setProcessing: (processing: boolean) => void;
  addCapture: (capture: CapturedImage) => void;
  setCurrentCapture: (capture: CapturedImage | null) => void;
  setMLLibrariesLoaded: (loaded: boolean) => void;
  setMLLoading: (loading: boolean) => void;
  setMLError: (error: string | null) => void;
  updateSettings: (settings: Record<string, any>) => void;
  clearCaptures: () => void;
}

const TryOnContext = createContext<TryOnContextValue | null>(null);

export function TryOnProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tryOnReducer, initialState);

  const openModal = () => dispatch({ type: 'OPEN_MODAL' });
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });
  const setProcessing = (processing: boolean) => 
    dispatch({ type: 'SET_PROCESSING', payload: processing });
  const addCapture = (capture: CapturedImage) => 
    dispatch({ type: 'ADD_CAPTURE', payload: capture });
  const setCurrentCapture = (capture: CapturedImage | null) => 
    dispatch({ type: 'SET_CURRENT_CAPTURE', payload: capture });
  const setMLLibrariesLoaded = (loaded: boolean) => 
    dispatch({ type: 'SET_ML_LIBRARIES_LOADED', payload: loaded });
  const setMLLoading = (loading: boolean) => 
    dispatch({ type: 'SET_ML_LOADING', payload: loading });
  const setMLError = (error: string | null) => 
    dispatch({ type: 'SET_ML_ERROR', payload: error });
  const updateSettings = (settings: Record<string, any>) => 
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  const clearCaptures = () => dispatch({ type: 'CLEAR_CAPTURES' });

  const value: TryOnContextValue = {
    ...state,
    openModal,
    closeModal,
    setProcessing,
    addCapture,
    setCurrentCapture,
    setMLLibrariesLoaded,
    setMLLoading,
    setMLError,
    updateSettings,
    clearCaptures,
  };

  return (
    <TryOnContext.Provider value={value}>
      {children}
    </TryOnContext.Provider>
  );
}

export function useTryOn() {
  const context = useContext(TryOnContext);
  if (!context) {
    throw new Error('useTryOn must be used within a TryOnProvider');
  }
  return context;
}