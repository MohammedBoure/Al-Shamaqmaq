import crypto from 'crypto';

/**
 * توليد كود غرفة قصير وواضح مكون من 4 أو 6 خانات (بدون حروف ملتبسة مثل O و 0 و I و 1)
 */
export function generateRoomCode(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    code += chars[randomIndex];
  }

  return code;
}

/**
 * توليد رمز جلسة عشوائي فريد للاعب لتسهيل إعادة الاتصال
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * توليد معرف فريد عام (ID)
 */
export function generateId(): string {
  return crypto.randomUUID();
}
