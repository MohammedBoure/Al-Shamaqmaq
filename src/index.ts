import dotenv from 'dotenv';
import { createApplication } from './server';
import { config } from './config';

dotenv.config();

const appInstance = createApplication();

appInstance.start(config.PORT, config.HOST).catch((err) => {
  console.error('فشل في تشغيل الخادم:', err);
  process.exit(1);
});

// معالجة الإغلاق النظيف للنظام
const handleShutdown = async (signal: string) => {
  console.log(`\nتم استلام إشارة الإغلاق (${signal}). جاري إيقاف الخادم بنظافة...`);
  try {
    await appInstance.stop();
    console.log('تم إيقاف الخادم بنجاح.');
    process.exit(0);
  } catch (err) {
    console.error('خطأ أثناء إيقاف الخادم:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
