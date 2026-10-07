# طبقة المتحكمات (Controllers)

يحتوي هذا المجلد على معالجات واجهات الـ REST API واتصالات الـ WebSocket للعبة.

## الملفات ومحتواها:

- **`apiController.ts`**:
  - يوفر مسارات REST API:
    - `GET /api/health`: فحص حالة ونشاط السيرفر.
    - `GET /api/topics`: استعراض قائمة المواضيع المتاحة وأوصافها وعدد الأسئلة.
    - `GET /api/topics/categories`: استعراض قائمة الفئات المصنفة شجرياً مع المواضيع الفرعية وشارات VIP.
    - `POST /api/rooms`: إنشاء غرفة جديدة بواسطة المضيف مع تحديد المواضيع المسموحة.
    - `GET /api/rooms/:roomCode`: فحص حالة الغرفة العامة والمواضيع المختارة واللاعبين.
- **`wsController.ts`**:
  - يدير تدفق الرسائل في الوقت الفعلي عبر الـ WebSockets:
    - إدارة الاتصال والقطع وإعادة الاتصال السريع بواسطة `sessionToken`.
    - توجيه ومعالجة أحداث اللاعبين: `JOIN_ROOM`, `UPDATE_PROFILE`, `UPDATE_SETTINGS`, `START_GAME`, `SELECT_TOPIC`, `SUBMIT_ANSWER`, `SUBMIT_BLUFF`, `SUBMIT_VOTE`, `NEXT_ROUND`, `PING`.
    - معالجة الأخطاء والتأكد من صحة الصلاحيات والحالات قبل تنفيذ أي أمر.
