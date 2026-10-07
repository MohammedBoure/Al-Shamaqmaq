# بنية بيانات اللعبة (Game Data Architecture)

تمت هيكلة بنك بيانات اللعبة بالكامل في مجلدات فئات فرعية مستقلة، بحيث تحتوي كل فئة على مجلد خاص بها يضم ملفات المواضيع والأسئلة وحزم البيانات بصيغة JSON مهيكلة:

```
data/
├── science/              # فئة العلوم
│   ├── category.json     # بيانات تعريف الفئة
│   ├── astronomy_space.json
│   ├── physics.json
│   ├── animals.json
│   ├── general_science.json
│   ├── biology.json
│   ├── mathematics.json
│   ├── botany.json
│   ├── anatomy_health.json
│   ├── medicine.json
│   ├── engineering.json
│   ├── medical_terms.json
│   ├── math_puzzles.json
│   ├── psychology.json
│   └── README.md
├── variety/              # فئة المنوعات
│   ├── category.json
│   ├── islamic_history.json
│   ├── arabic_literature.json
│   ├── world_geography.json
│   ├── inventions.json
│   ├── riddles.json
│   └── README.md
├── weekly/               # فئات الأسبوع
│   ├── category.json
│   ├── weekly_celebrities.json
│   ├── weekly_sports.json
│   └── README.md
├── new_categories/       # فئات جديدة
│   ├── category.json
│   ├── ai_tech.json
│   ├── video_games.json
│   └── README.md
└── topics.json           # ملف احتياطي للتوافقية
```

## هيكل ملف الفئة (`category.json`):
- `id`: المعرف الفريد للفئة (مثل `science`).
- `title`: اسم الفئة المعروض بالعربية (مثل `علوم`).
- `icon`: أيقونة الفئة.
- `badge`: الشارة المعروضة بجانب الفئة.
- `color`: اللون المميز للفئة.
- `order`: ترتيب الظهور.

## هيكل ملف الموضوع (`*.json`):
- `id`: المعرف الفريد للموضوع (مثل `astronomy_space`).
- `categoryId`: معرف الفئة الأم التابع لها.
- `categoryTitle`: اسم الفئة الأم.
- `title`: العنوان المعروض للموضوع.
- `description`: وصف الموضوع.
- `cover_image`: صورة الغلاف المعروضة في بطاقة الموضوع.
- `is_vip`: هل الموضوع مميز (شارة VIP).
- `puzzles`: مصفوفة الأسئلة والألغاز، وكل لغز يحتوي على `id` و`prompt` و`answer_type` و`correct_answers`.
