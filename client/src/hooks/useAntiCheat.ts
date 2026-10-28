import { useState, useEffect, useRef } from 'react';
import { CheatType } from '../types';

interface UseAntiCheatOptions {
  enabled: boolean;
  onCheatDetected: (cheatType: CheatType) => void;
}

/**
 * خطاف كشف الغش وحماية الشاشة (Anti-Cheat & Screen Shield)
 * يكتشف:
 * 1. مغادرة المتصفح أو تبديل التبويبات لسؤال الذكاء الاصطناعي أو البحث (TAB_SWITCH)
 * 2. الخروج من نافذة اللعبة لفتح أداة خارجية (WINDOW_BLUR)
 * 3. محاولة أخذ لقطة شاشة (SCREENSHOT) عبر اختصارات لوحة المفاتيح والنظام
 * 4. محاولة نسخ السؤال أو لصق إجابة خارجية (COPY_PASTE)
 * كما يقوم بإخفاء وتغبيش السؤال فوراً عند فقدان تركيز النافذة لمنع تصوير الشاشة!
 */
export function useAntiCheat({ enabled, onCheatDetected }: UseAntiCheatOptions) {
  const [isScreenShieldActive, setIsScreenShieldActive] = useState<boolean>(false);
  const [shieldReason, setShieldReason] = useState<string>('');
  const onCheatRef = useRef(onCheatDetected);
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shieldResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurStartTimeRef = useRef<number | null>(null);
  const hadVisibilityHideRef = useRef<boolean>(false);

  useEffect(() => {
    onCheatRef.current = onCheatDetected;
  }, [onCheatDetected]);

  useEffect(() => {
    if (!enabled) {
      setIsScreenShieldActive(false);
      setShieldReason('');
      return;
    }

    const isTouchDevice = () =>
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));

    const triggerScreenshotShield = () => {
      setIsScreenShieldActive(true);
      setShieldReason('🚨 تم رصد محاولة تصوير الشاشة! السؤال محمي 📸');
      onCheatRef.current('SCREENSHOT');

      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText('ممنوع الغش أو تصوير الأسئلة في لعبة ESC 🕵️‍♂️');
        }
      } catch (_) {}

      if (shieldResetTimerRef.current) clearTimeout(shieldResetTimerRef.current);
      shieldResetTimerRef.current = setTimeout(() => {
        setIsScreenShieldActive(false);
      }, 3000);
    };

    // 1. كشف تبديل التبويب أو الخروج من المتصفح في الجوال/الكمبيوتر (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        hadVisibilityHideRef.current = true;
        setIsScreenShieldActive(true);
        setShieldReason('تم إخفاء السؤال بسبب مغادرة التبويب أو التطبيق!');
        onCheatRef.current('TAB_SWITCH');
      } else {
        // إبقاء الدرع لمدة وجيزة عند العودة ثم رفعه
        if (shieldResetTimerRef.current) clearTimeout(shieldResetTimerRef.current);
        shieldResetTimerRef.current = setTimeout(() => {
          hadVisibilityHideRef.current = false;
          if (document.hasFocus()) {
            setIsScreenShieldActive(false);
          }
        }, 1200);
      }
    };

    // 2. كشف فقدان التركيز عن النافذة أو ومضة تصوير الشاشة في الجوال (iOS / Android Screenshot Overlay)
    const handleWindowBlur = () => {
      blurStartTimeRef.current = Date.now();
      setIsScreenShieldActive(true);
      setShieldReason('تم إخفاء السؤال لحماية الجولة من الغش أو تصوير الشاشة 📸');

      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => {
        // إذا فقدت النافذة التركيز لأكثر من 0.85 ثانية دون إخفاء التبويب (مثل نافذة عائمة أو تقسيم الشاشة)
        if (!document.hidden && !document.hasFocus()) {
          onCheatRef.current('WINDOW_BLUR');
        }
      }, 850);
    };

    const handleWindowFocus = () => {
      const blurStart = blurStartTimeRef.current;
      blurStartTimeRef.current = null;

      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }

      // في الهواتف (Android / iOS)، أخذ لقطة شاشة بالأزرار أو مركز التحكم يسبب فقدان تركيز لحظي (15ms - 850ms)
      if (blurStart && isTouchDevice() && !hadVisibilityHideRef.current && !document.hidden) {
        const blurDuration = Date.now() - blurStart;
        if (blurDuration >= 15 && blurDuration < 850) {
          triggerScreenshotShield();
          return;
        }
      }

      if (shieldResetTimerRef.current) clearTimeout(shieldResetTimerRef.current);
      shieldResetTimerRef.current = setTimeout(() => {
        setIsScreenShieldActive(false);
        setShieldReason('');
      }, 600);
    };

    // 3. كشف إيماءة تصوير الشاشة بثلاثة أصابع على الهواتف الذكية (3-Finger Screenshot Swipe)
    const handleTouchGesture = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        triggerScreenshotShield();
      }
    };

    // 4. كشف اختصارات تصوير الشاشة (PrintScreen / Win+Shift+S / Cmd+Shift+3/4/5 / أزرار الصوت في الجوال)
    const handleKeyDownOrUp = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
      const isSnippingTool =
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5');
      const isMobileVolumeScreenshotKey =
        isTouchDevice() &&
        (e.key === 'AudioVolumeDown' || e.key === 'VolumeDown' || e.keyCode === 174 || e.keyCode === 25);

      if (isPrintScreen || isSnippingTool || isMobileVolumeScreenshotKey) {
        if (!isMobileVolumeScreenshotKey) {
          e.preventDefault();
        }
        triggerScreenshotShield();
      }
    };

    // 5. منع وكشف محاولة نسخ نص السؤال (Copy / Cut)
    const handleCopyOrCut = (e: ClipboardEvent) => {
      e.preventDefault();
      onCheatRef.current('COPY_PASTE');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('touchstart', handleTouchGesture, { passive: true });
    window.addEventListener('touchmove', handleTouchGesture, { passive: true });
    window.addEventListener('keydown', handleKeyDownOrUp);
    window.addEventListener('keyup', handleKeyDownOrUp);
    document.addEventListener('copy', handleCopyOrCut);
    document.addEventListener('cut', handleCopyOrCut);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('touchstart', handleTouchGesture);
      window.removeEventListener('touchmove', handleTouchGesture);
      window.removeEventListener('keydown', handleKeyDownOrUp);
      window.removeEventListener('keyup', handleKeyDownOrUp);
      document.removeEventListener('copy', handleCopyOrCut);
      document.removeEventListener('cut', handleCopyOrCut);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      if (shieldResetTimerRef.current) clearTimeout(shieldResetTimerRef.current);
    };
  }, [enabled]);

  return {
    isScreenShieldActive,
    shieldReason,
  };
}

