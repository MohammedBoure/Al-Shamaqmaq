import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptic() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'medium':
            navigator.vibrate(25);
            break;
          case 'heavy':
            navigator.vibrate(50);
            break;
          case 'success':
            navigator.vibrate([15, 40, 30]);
            break;
          case 'warning':
            navigator.vibrate([30, 50, 30]);
            break;
          case 'error':
            navigator.vibrate([50, 50, 80]);
            break;
        }
      } catch (e) {
        // Ignored on non-supporting devices
      }
    }
  }, []);

  return { triggerHaptic };
}
