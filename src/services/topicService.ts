import fs from 'fs';
import path from 'path';
import { Topic, TopicSummary, CategoryGroup, Puzzle } from '../types/topics';

export class TopicService {
  private topics: Map<string, Topic> = new Map();
  private categoryGroups: Map<string, CategoryGroup> = new Map();

  constructor(basePath?: string) {
    const defaultDataDir = path.resolve(__dirname, '../../data');
    this.load(basePath || defaultDataDir);
  }

  /**
   * تحميل المواضيع إما من مجلد مهيكل (data/) أو من ملف مفرد (topics.json)
   */
  public load(targetPath: string): void {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Data path not found at: ${targetPath}`);
    }

    const stat = fs.statSync(targetPath);
    this.topics.clear();
    this.categoryGroups.clear();

    if (stat.isDirectory()) {
      this.loadFromDirectory(targetPath);
    } else {
      this.loadFromFile(targetPath);
    }
  }

  /**
   * تحميل البيانات المهيكلة من مجلد الفئات:
   * data/
   *   ├── category_1/
   *   │     ├── category.json
   *   │     ├── subtopic_a.json
   *   │     └── subtopic_b.json
   */
  private loadFromDirectory(dirPath: string): void {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // فحص المجلدات الفرعية للفئات
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const categoryDir = path.join(dirPath, entry.name);
        this.loadCategoryDirectory(categoryDir, entry.name);
      }
    }

    // فحص ما إذا كان هناك ملف topics.json في الجذر لدعم التوافقية السابقة
    const legacyFile = path.join(dirPath, 'topics.json');
    if (fs.existsSync(legacyFile) && this.topics.size === 0) {
      this.loadFromFile(legacyFile);
    }
  }

  /**
   * قراءة مجلد فئة معينة ومحتوياته
   */
  private loadCategoryDirectory(categoryDirPath: string, dirName: string): void {
    const categoryJsonPath = path.join(categoryDirPath, 'category.json');
    let categoryMeta: Partial<CategoryGroup> = {
      id: dirName,
      title: dirName,
      order: 99,
    };

    if (fs.existsSync(categoryJsonPath)) {
      try {
        const raw = fs.readFileSync(categoryJsonPath, 'utf-8');
        const parsed = JSON.parse(raw);
        categoryMeta = { ...categoryMeta, ...parsed };
      } catch (err) {
        console.error(`Failed to parse category.json in ${categoryDirPath}:`, err);
      }
    }

    const subtopics: TopicSummary[] = [];
    const files = fs.readdirSync(categoryDirPath);

    for (const file of files) {
      if (file.endsWith('.json') && file !== 'category.json') {
        const filePath = path.join(categoryDirPath, file);
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const topic: Topic = JSON.parse(raw);

          this.validateTopic(topic, filePath);

          topic.categoryId = topic.categoryId || categoryMeta.id;
          topic.categoryTitle = topic.categoryTitle || categoryMeta.title;

          this.topics.set(topic.id, topic);

          subtopics.push({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            categoryId: topic.categoryId,
            categoryTitle: topic.categoryTitle,
            cover_image: topic.cover_image,
            is_vip: topic.is_vip,
            puzzleCount: topic.puzzles.length,
          });
        } catch (err: any) {
          throw new Error(`Error reading topic file ${filePath}: ${err.message}`);
        }
      }
    }

    const categoryId = categoryMeta.id || dirName;
    this.categoryGroups.set(categoryId, {
      id: categoryId,
      title: categoryMeta.title || dirName,
      description: categoryMeta.description,
      icon: categoryMeta.icon,
      badge: categoryMeta.badge,
      color: categoryMeta.color,
      order: categoryMeta.order ?? 99,
      subtopics,
    });
  }

  /**
   * تحميل مباشر من ملف مفرد للتوافقية مع الاختبارات
   */
  private loadFromFile(filePath: string): void {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedTopics: Topic[] = JSON.parse(rawData);

    if (!Array.isArray(parsedTopics)) {
      throw new Error('Invalid topics data: root must be an array of topics');
    }

    for (const topic of parsedTopics) {
      this.validateTopic(topic, filePath);
      this.topics.set(topic.id, topic);
    }
  }

  /**
   * التحقق من صحة بنية الموضوع والأسئلة التابعة له
   */
  private validateTopic(topic: Topic, source: string): void {
    if (!topic.id || !topic.title || !Array.isArray(topic.puzzles)) {
      throw new Error(`Topic has invalid format in ${source}: ${JSON.stringify(topic)}`);
    }

    for (const puzzle of topic.puzzles) {
      if (!puzzle.id || !puzzle.prompt || !Array.isArray(puzzle.correct_answers) || puzzle.correct_answers.length === 0) {
        throw new Error(`Puzzle ${puzzle.id} has invalid format in topic ${topic.id} (${source})`);
      }
    }
  }

  /**
   * تحميل ملف المواضيع (دالة متبقية للتوافقية مع أي استدعاء قديم)
   */
  public loadTopics(filePath: string): void {
    this.load(filePath);
  }

  /**
   * جلب جميع مجموعات الفئات مرتبة حسب ترتيبها المحدد
   */
  public getCategoryGroups(): CategoryGroup[] {
    return Array.from(this.categoryGroups.values()).sort(
      (a, b) => (a.order ?? 99) - (b.order ?? 99)
    );
  }

  /**
   * جلب جميع المواضيع كاملة
   */
  public getAllTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  /**
   * جلب ملخصات المواضيع لعرضها دون كشف الألغاز
   */
  public getTopicSummaries(): TopicSummary[] {
    return Array.from(this.topics.values()).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      categoryId: t.categoryId,
      categoryTitle: t.categoryTitle,
      cover_image: t.cover_image,
      is_vip: t.is_vip,
      puzzleCount: t.puzzles.length,
    }));
  }

  /**
   * جلب موضوع بواسطة المعرف الخاص به
   */
  public getTopicById(topicId: string): Topic | undefined {
    return this.topics.get(topicId);
  }

  /**
   * التحقق من صحة قائمة معرفات المواضيع
   */
  public validateTopicIds(topicIds: string[]): boolean {
    if (!topicIds || topicIds.length === 0) return false;
    return topicIds.every((id) => this.topics.has(id));
  }

  /**
   * اختيار لغز عشوائي من موضوع مع استبعاد الألغاز التي لُعبت بالفعل في الغرفة
   */
  public getRandomPuzzle(topicId: string, excludedPuzzleIds: Set<string>): Puzzle | null {
    const topic = this.topics.get(topicId);
    if (!topic || topic.puzzles.length === 0) {
      return null;
    }

    const availablePuzzles = topic.puzzles.filter((p) => !excludedPuzzleIds.has(p.id));

    // إذا تم استنفاد جميع الألغاز في هذا الموضوع، نعيد التدوير من بين الألغاز المتاحة
    const candidateList = availablePuzzles.length > 0 ? availablePuzzles : topic.puzzles;
    const randomIndex = Math.floor(Math.random() * candidateList.length);

    return candidateList[randomIndex];
  }
}

// تصدير نسخة عامة أحادية (Singleton)
export const topicService = new TopicService();
