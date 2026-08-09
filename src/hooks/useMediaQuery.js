import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches with SSR safety
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => {
      setMatches(event.matches);
    };

    // Set initial value in effect
    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
      return () => mediaQueryList.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
      return () => mediaQueryList.removeListener(listener);
    }
  }, [query]);

  return matches;
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)');
}
