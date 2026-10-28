import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

// تتبع تفاعل المستخدم مع الصفحة لتفادي حظر المتصفح (Browser User Activation Intervention)
let hasUserInteracted = false;
if (typeof window !== 'undefined') {
  const markInteraction = () => {
    hasUserInteracted = true;
    window.removeEventListener('pointerdown', markInteraction);
    window.removeEventListener('touchstart', markInteraction);
    window.removeEventListener('keydown', markInteraction);
    window.removeEventListener('click', markInteraction);
  };
  window.addEventListener('pointerdown', markInteraction, { passive: true });
  window.addEventListener('touchstart', markInteraction, { passive: true });
  window.addEventListener('keydown', markInteraction, { passive: true });
  window.addEventListener('click', markInteraction, { passive: true });
}

export function useHaptic() {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (typeof window === 'undefined' || !('navigator' in window) || !('vibrate' in navigator)) {
      return;
    }

    // التحقق من أن المستخدم قد تفاعل مسبقاً مع الصفحة قبل استدعاء الاهتزاز
    const userActivation = (navigator as any).userActivation;
    if (userActivation && !userActivation.hasBeenActive) {
      return;
    }
    if (!userActivation && !hasUserInteracted) {
      return;
    }

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
    } catch (_) {
      // Ignored on non-supporting devices or restricted frames
    }
  }, []);

  return { triggerHaptic };
}
