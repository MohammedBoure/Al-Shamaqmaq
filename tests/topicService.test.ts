import { describe, it, expect } from 'vitest';
import { topicService } from '../src/services/topicService';

describe('TopicService', () => {
  it('loads topics correctly from json file', () => {
    const topics = topicService.getAllTopics();
    expect(topics.length).toBeGreaterThanOrEqual(4);

    const summaries = topicService.getTopicSummaries();
    expect(summaries.length).toBe(topics.length);

    for (const summary of summaries) {
      expect(summary.id).toBeTruthy();
      expect(summary.title).toBeTruthy();
      expect(summary.puzzleCount).toBeGreaterThan(0);
      // تأكيد عدم تسريب الألغاز أو الإجابات في الملخص
      expect((summary as any).puzzles).toBeUndefined();
    }
  });

  it('retrieves specific topic by id', () => {
    const topic = topicService.getTopicById('الفيزياء');
    expect(topic).toBeDefined();
    expect(topic?.title).toContain('فيزياء');
    expect(topic?.puzzles.length).toBeGreaterThan(0);
  });

  it('selects random puzzle excluding previously played puzzles', () => {
    const topicId = 'الفيزياء';
    const excluded = new Set<string>();

    const puzzle1 = topicService.getRandomPuzzle(topicId, excluded);
    expect(puzzle1).not.toBeNull();
    if (puzzle1) {
      excluded.add(puzzle1.id);
      const puzzle2 = topicService.getRandomPuzzle(topicId, excluded);
      expect(puzzle2).not.toBeNull();
      if (puzzle2) {
        expect(puzzle2.id).not.toBe(puzzle1.id);
      }
    }
  });

  it('loads category hierarchy and groups correctly', () => {
    const categories = topicService.getCategoryGroups();
    expect(categories.length).toBeGreaterThanOrEqual(4);

    const scienceCategory = categories.find((c) => c.id === 'science');
    expect(scienceCategory).toBeDefined();
    expect(scienceCategory?.title).toBe('علوم');
    expect(scienceCategory?.subtopics.length).toBeGreaterThanOrEqual(10);

    const generalCategory = categories.find((c) => c.id === 'general');
    expect(generalCategory).toBeDefined();
    expect(generalCategory?.title).toBe('معلومات عامة');

    // التأكد من ملخصات المواضيع
    expect(Array.isArray(scienceCategory?.subtopics)).toBe(true);
    expect(scienceCategory!.subtopics.length).toBeGreaterThan(0);
  });
});
