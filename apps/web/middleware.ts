/**
 * Next.js Middleware for Internationalization
 * Handles locale detection and routing
 * 
 * TEMPORARILY DISABLED to fix build errors
 * Re-enable after fixing prerender issues
 */

// import createMiddleware from 'next-intl/middleware';
// import { locales, defaultLocale, pathnames } from './src/i18n/config';

// export default createMiddleware({
//   // A list of all locales that are supported
//   locales,

//   // Used when no locale matches
//   defaultLocale,

//   // Pathnames configuration for localized routing
//   pathnames,

//   // Locale detection strategy
//   localeDetection: true,

//   // Don't use locale prefix for default locale
//   localePrefix: 'as-needed',
// });

// export const config = {
//   // Match only internationalized pathnames
//   matcher: [
//     // Enable a redirect to a matching locale at the root
//     '/',

//     // Set a cookie to remember the previous locale for
//     // all requests that have a locale prefix
//     '/(hi-IN|te-IN|ta-IN|kn-IN|ml-IN|bn-IN|gu-IN|mr-IN|pa-IN)/:path*',

//     // Enable redirects that add missing locales
//     // (e.g. `/pathnames` -> `/en/pathnames`)
//     '/((?!_next|_vercel|.*\\..*).*)'
//   ]
// };

// Placeholder export to satisfy Next.js
export { default } from 'next/server';