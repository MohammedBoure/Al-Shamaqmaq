import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  removeArabicDiacritics,
  normalizeArabicLetters,
  convertArabicNumeralsToStandard,
  checkAnswerMatch,
  areAnswersDuplicate,
  levenshteinDistance,
} from '../src/utils/textNormalizer';

describe('Arabic Text Normalization & Matching Utilities', () => {
  it('should remove Arabic diacritics (tashkeel) and tatweel', () => {
    const raw = 'مَدِينَةُ السَّلَامِ ومُحَمَّـــد';
    const cleaned = removeArabicDiacritics(raw);
    expect(cleaned).toBe('مدينة السلام ومحمد');
  });

  it('should normalize Arabic letters (Alef, Yaa, Taa Marbuta)', () => {
    expect(normalizeArabicLetters('أحمد')).toBe('احمد');
    expect(normalizeArabicLetters('إبراهيم')).toBe('ابراهيم');
    expect(normalizeArabicLetters('موسى')).toBe('موسي');
    expect(normalizeArabicLetters('مدرسة')).toBe('مدرسه');
  });

  it('should convert Eastern Arabic numerals to standard Latin digits', () => {
    expect(convertArabicNumeralsToStandard('سنة ١٤٥٣')).toBe('سنة 1453');
    expect(convertArabicNumeralsToStandard('٣')).toBe('3');
  });

  it('should perform full text normalization properly', () => {
    const text = '  أَلْقَرَوِيِّينَ!؟  ';
    expect(normalizeText(text)).toBe('القرويين');
  });

  it('should calculate Levenshtein distance accurately', () => {
    expect(levenshteinDistance('ماركوني', 'ماركوني')).toBe(0);
    expect(levenshteinDistance('ماركوني', 'ماركون')).toBe(1);
    expect(levenshteinDistance('كتاب', 'كتكوت')).toBe(3);
  });

  describe('checkAnswerMatch', () => {
    it('matches exact text correctly', () => {
      expect(checkAnswerMatch('1453', ['1453'], 'text_exact')).toBe(true);
      expect(checkAnswerMatch('1454', ['1453'], 'text_exact')).toBe(false);
    });

    it('matches normalized Arabic text ignoring diacritics, alef forms, and taa marbuta', () => {
      const correct = ['جامعة القرويين', 'القرويين'];

      expect(checkAnswerMatch('جامعة القرويين', correct, 'text_normalized')).toBe(true);
      expect(checkAnswerMatch('جَامِعَةُ القَرَوِيِّين', correct, 'text_normalized')).toBe(true);
      expect(checkAnswerMatch('جامعه القرويين', correct, 'text_normalized')).toBe(true);
      expect(checkAnswerMatch('القرويين', correct, 'text_normalized')).toBe(true);
      expect(checkAnswerMatch('قرويين', correct, 'text_normalized')).toBe(true); // without 'al'
      expect(checkAnswerMatch('جامعة الأزهر', correct, 'text_normalized')).toBe(false);
    });

    it('matches numbers in numeric or text form', () => {
      const correct = ['3', 'ثلاثة', 'ثلاث'];

      expect(checkAnswerMatch('3', correct, 'number')).toBe(true);
      expect(checkAnswerMatch('٣', correct, 'number')).toBe(true);
      expect(checkAnswerMatch('ثلاثة', correct, 'number')).toBe(true);
      expect(checkAnswerMatch('ثلاث', correct, 'number')).toBe(true);
      expect(checkAnswerMatch('4', correct, 'number')).toBe(false);
    });
  });

  describe('areAnswersDuplicate', () => {
    it('detects duplicate bluff submissions', () => {
      expect(areAnswersDuplicate('الكبد', 'الكَبِدُ')).toBe(true);
      expect(areAnswersDuplicate('الرئة', 'رئة')).toBe(true);
      expect(areAnswersDuplicate('ماركوني', 'ماركوني')).toBe(true);
      expect(areAnswersDuplicate('القلب', 'المخ')).toBe(false);
    });
  });
});
