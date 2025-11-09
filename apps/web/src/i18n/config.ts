/**
 * Internationalization Configuration
 * Defines supported locales and default settings
 */

// Supported locales - en-IN as default, with scaffolding for future expansion
export const locales = [
  'en-IN', // English (India) - Primary locale
  'hi-IN', // Hindi (India) - Future locale
  'te-IN', // Telugu (India) - Future locale  
  'ta-IN', // Tamil (India) - Future locale
  'kn-IN', // Kannada (India) - Future locale
  'ml-IN', // Malayalam (India) - Future locale
  'bn-IN', // Bengali (India) - Future locale
  'gu-IN', // Gujarati (India) - Future locale
  'mr-IN', // Marathi (India) - Future locale
  'pa-IN', // Punjabi (India) - Future locale
] as const;

export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en-IN';

// Locale configuration
export const localeConfig = {
  'en-IN': {
    name: 'English (India)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'latn', // Latin numerals
    rtl: false,
  },
  'hi-IN': {
    name: 'हिन्दी (भारत)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'deva', // Devanagari numerals
    rtl: false,
  },
  'te-IN': {
    name: 'తెలుగు (భారతదేశం)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'telu', // Telugu numerals
    rtl: false,
  },
  'ta-IN': {
    name: 'தமிழ் (இந்தியா)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'taml', // Tamil numerals
    rtl: false,
  },
  'kn-IN': {
    name: 'ಕನ್ನಡ (ಭಾರತ)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'knda', // Kannada numerals
    rtl: false,
  },
  'ml-IN': {
    name: 'മലയാളം (ഇന്ത്യ)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'mlym', // Malayalam numerals
    rtl: false,
  },
  'bn-IN': {
    name: 'বাংলা (ভারত)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'beng', // Bengali numerals
    rtl: false,
  },
  'gu-IN': {
    name: 'ગુજરાતી (ભારત)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'gujr', // Gujarati numerals
    rtl: false,
  },
  'mr-IN': {
    name: 'मराठी (भारत)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'deva', // Devanagari numerals
    rtl: false,
  },
  'pa-IN': {
    name: 'ਪੰਜਾਬੀ (ਭਾਰਤ)',
    currency: 'INR',
    currencySymbol: '₹',
    timeZone: 'Asia/Kolkata',
    dateFormat: 'dd/MM/yyyy',
    numberSystem: 'guru', // Gurmukhi numerals
    rtl: false,
  },
} as const;

// Helper function to get locale configuration
export function getLocaleConfig(locale: Locale) {
  return localeConfig[locale] || localeConfig[defaultLocale];
}

// Helper function to check if locale is supported
export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Helper function to get currency for locale
export function getCurrency(locale: Locale): string {
  return getLocaleConfig(locale).currency;
}

// Helper function to get currency symbol for locale
export function getCurrencySymbol(locale: Locale): string {
  return getLocaleConfig(locale).currencySymbol;
}

// Routing configuration
export const pathnames = {
  '/': '/',
  '/catalog': '/catalog',
  '/catalog/[category]': '/catalog/[category]',
  '/product/[id]': '/product/[id]',
  '/cart': '/cart',
  '/checkout': '/checkout',
  '/orders': '/orders',
  '/profile': '/profile',
  '/about': '/about',
  '/contact': '/contact',
  '/privacy': '/privacy',
  '/terms': '/terms',
} as const;