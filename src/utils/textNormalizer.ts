import { AnswerType } from '../types/topics';

/**
 * تحويل الأرقام العربية المشرقية والفارسية إلى أرقام قياسية (0-9)
 */
export function convertArabicNumeralsToStandard(input: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(arabicNumerals[i], i.toString());
    result = result.replaceAll(persianNumerals[i], i.toString());
  }
  return result;
}

/**
 * إزالة التشكيل والحركات والتطويل من النص العربي
 */
export function removeArabicDiacritics(input: string): string {
  return input
    // إزالة التشكيل (الفتحة، الضمة، الكسرة، التنوين، الشدة، السكون، إلخ)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // إزالة التطويل (الكشيدة)
    .replace(/\u0640/g, '');
}

/**
 * تطبيع الحروف العربية المتقاربة لضمان مرونة التدقيق
 */
export function normalizeArabicLetters(input: string): string {
  let text = input;

  // توحيد الهمزات والألف
  text = text.replace(/[إأآٱ]/g, 'ا');

  // توحيد الياء والألف المقصورة
  text = text.replace(/ى/g, 'ي');

  // توحيد التاء المربوطة والهاء في أواخر الكلمات
  text = text.replace(/ة/g, 'ه');

  return text;
}

/**
 * تنظيف وتطبيع النص الكامل (إزالة علامات الترقيم، المسافات الزائدة، وتوحيد الحروف)
 */
export function normalizeText(input: string): string {
  if (!input) return '';

  let text = input.trim().toLowerCase();
  text = convertArabicNumeralsToStandard(text);
  text = removeArabicDiacritics(text);
  text = normalizeArabicLetters(text);

  // إزالة علامات الترقيم والرموز الخاصة
  text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،؛"'’«»\[\]<>]/g, ' ');

  // دمج المسافات المتعددة في مسافة واحدة
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * حساب المسافة التحريرية (Levenshtein Distance) لاكتشاف الأخطاء المطبعية الطفيفة
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // حذف
        dp[i][j - 1] + 1, // إضافة
        dp[i - 1][j - 1] + cost // استبدال
      );
    }
  }

  return dp[m][n];
}

/**
 * التحقق من تطابق إجابة اللاعب مع إحدى الإجابات الصحيحة المقبولة
 */
export function checkAnswerMatch(
  userAnswer: string,
  correctAnswers: string[],
  answerType: AnswerType
): boolean {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return false;
  }

  const trimmedUser = userAnswer.trim();

  switch (answerType) {
    case 'text_exact': {
      const cleanUser = trimmedUser.toLowerCase();
      return correctAnswers.some((ans) => ans.trim().toLowerCase() === cleanUser);
    }

    case 'number': {
      const normUserNum = convertArabicNumeralsToStandard(trimmedUser).replace(/[^\d.-]/g, '');
      const userNum = parseFloat(normUserNum);

      if (!isNaN(userNum)) {
        for (const ans of correctAnswers) {
          const normAnsNum = convertArabicNumeralsToStandard(ans).replace(/[^\d.-]/g, '');
          const ansNum = parseFloat(normAnsNum);
          if (!isNaN(ansNum) && userNum === ansNum) {
            return true;
          }
        }
      }

      // إذا كانت الإجابة الرقمية مدخلة لفظاً (مثل "ثلاثة")، نقارنها بالنص المطبع
      const normalizedUserText = normalizeText(userAnswer);
      return correctAnswers.some((ans) => normalizeText(ans) === normalizedUserText);
    }

    case 'text_normalized':
    default: {
      const normalizedUser = normalizeText(userAnswer);
      if (!normalizedUser) return false;

      // فحص التطابق المطبعي المباشر
      for (const ans of correctAnswers) {
        const normalizedTarget = normalizeText(ans);
        if (normalizedUser === normalizedTarget) {
          return true;
        }

        // إزالة "ال" التعريف إذا كانت هي الفرق الوحيد
        const userNoAl = normalizedUser.replace(/^ال/, '');
        const targetNoAl = normalizedTarget.replace(/^ال/, '');
        if (userNoAl === targetNoAl && userNoAl.length > 2) {
          return true;
        }

        // مسافة تحريرية تسامحية في حال وجود خطأ مطبعي بحرف واحد في الكلمات الطويلة
        if (normalizedTarget.length >= 6) {
          const dist = levenshteinDistance(normalizedUser, normalizedTarget);
          if (dist <= 1) {
            return true;
          }
        }
      }

      return false;
    }
  }
}

/**
 * فحص ما إذا كانت إجابتان مزيفتان متطابقتين أو شديدتي التقارب (لمنع التكرار)
 */
export function areAnswersDuplicate(ans1: string, ans2: string): boolean {
  const norm1 = normalizeText(ans1);
  const norm2 = normalizeText(ans2);

  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;

  // إزالة "ال" التعريف للمقارنة
  if (norm1.replace(/^ال/, '') === norm2.replace(/^ال/, '')) {
    return true;
  }

  // مسافة تحريرية بسيطة
  if (norm1.length >= 5 && norm2.length >= 5) {
    if (levenshteinDistance(norm1, norm2) <= 1) {
      return true;
    }
  }

  return false;
}
