import fs from 'fs';
import path from 'path';
import { Topic, TopicSummary, Puzzle } from '../types/topics';

export class TopicService {
  private topics: Map<string, Topic> = new Map();

  constructor(filePath?: string) {
    const defaultPath = path.resolve(__dirname, '../../data/topics.json');
    this.loadTopics(filePath || defaultPath);
  }

  /**
   * تحميل ملف المواضيع والتحقق من صحة بنيته
   */
  public loadTopics(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Topics file not found at: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedTopics: Topic[] = JSON.parse(rawData);

    if (!Array.isArray(parsedTopics)) {
      throw new Error('Invalid topics data: root must be an array of topics');
    }

    this.topics.clear();

    for (const topic of parsedTopics) {
      if (!topic.id || !topic.title || !Array.isArray(topic.puzzles)) {
        throw new Error(`Topic has invalid format: ${JSON.stringify(topic)}`);
      }

      for (const puzzle of topic.puzzles) {
        if (!puzzle.id || !puzzle.prompt || !Array.isArray(puzzle.correct_answers) || puzzle.correct_answers.length === 0) {
          throw new Error(`Puzzle ${puzzle.id} has invalid format in topic ${topic.id}`);
        }
      }

      this.topics.set(topic.id, topic);
    }
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
