// hotjar.ts - Hotjar analytics wrapper
export const hotjar = () => {
  if (typeof window !== 'undefined' && (window as any).hj) {
    return (window as any).hj;
  }
  return (...args: any[]) => {
    console.log('hotjar:', ...args);
  };
};

export default hotjar;