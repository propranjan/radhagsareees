// gtag.ts - Google Analytics wrapper
export const gtag = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    return window.gtag;
  }
  return (...args: any[]) => {
    console.log('gtag:', ...args);
  };
};

export default gtag;