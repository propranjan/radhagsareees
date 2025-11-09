/**
 * Next.js Internationalization Configuration
 * Supports en-IN (English India) as default with scaffolding for future locales
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale, getLocaleConfig, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  const config = getLocaleConfig(locale as Locale);

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: config.timeZone,
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        medium: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
        long: {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      },
      number: {
        currency: {
          style: 'currency',
          currency: config.currency,
          currencyDisplay: 'symbol',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
        decimal: {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        },
      },
    },
  };
});