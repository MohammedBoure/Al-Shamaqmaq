import { useState, useCallback, useEffect, useRef } from 'react';

const ARABIC_DIGIT_NAMES: Record<string, string> = {
  '0': 'صِفْر',
  '1': 'واحِد',
  '2': 'اِثْنان',
  '3': 'ثَلاثَة',
  '4': 'أَرْبَعَة',
  '5': 'خَمْسَة',
  '6': 'سِتَّة',
  '7': 'سَبْعَة',
  '8': 'ثَمانِيَة',
  '9': 'تِسْعَة',
};

const ARABIC_LETTER_NAMES: Record<string, string> = {
  A: 'إِي',
  B: 'بِي',
  C: 'سِي',
  D: 'دِي',
  E: 'إِي',
  F: 'إِف',
  G: 'جِي',
  H: 'إِتْش',
  I: 'آي',
  J: 'جِيه',
  K: 'كِيه',
  L: 'إِل',
  M: 'إِم',
  N: 'إِن',
  O: 'أُو',
  P: 'بِي',
  Q: 'كِيُو',
  R: 'آر',
  S: 'إِس',
  T: 'تِي',
  U: 'يُو',
  V: 'فِي',
  W: 'دَبْلِيُو',
  X: 'إِكْس',
  Y: 'وَاي',
  Z: 'زِد',
};

export function useCodeDictation() {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopDictation = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const dictateCode = useCallback(
    (code: string) => {
      if (!('speechSynthesis' in window)) {
        alert('ميزة القراءة الصوتية غير مدعومة في متصفحك.');
        return;
      }

      window.speechSynthesis.cancel();

      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return;

      // نطق الحروف والأرقام بوضوح مع فواصل زمنية حتى يسهل على اللاعبين كتابتها
      const spokenUnits = cleanCode
        .split('')
        .map((char) => {
          if (ARABIC_DIGIT_NAMES[char]) return ARABIC_DIGIT_NAMES[char];
          if (ARABIC_LETTER_NAMES[char]) return ARABIC_LETTER_NAMES[char];
          return char;
        })
        .join(' ... ');

      const phrase = `رَمْزُ الغُرْفَة: ... ${spokenUnits}`;
      const utterance = new SpeechSynthesisUtterance(phrase);

      utterance.lang = 'ar-SA';
      utterance.rate = 0.8; // سرعة هادئة ومفهومة جداً
      utterance.pitch = 1.0;

      // محاولة العثور على صوت عربي مثبت
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return {
    isSpeaking,
    isSupported,
    dictateCode,
    stopDictation,
  };
}
