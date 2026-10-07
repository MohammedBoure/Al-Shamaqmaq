export type AnswerType = 'text_exact' | 'text_normalized' | 'number';

export interface Puzzle {
  id: string;
  prompt: string;
  image_url?: string;
  answer_type: AnswerType;
  correct_answers: string[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  categoryTitle?: string;
  cover_image?: string;
  is_vip?: boolean;
  puzzles: Puzzle[];
}

export interface TopicSummary {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  categoryTitle?: string;
  cover_image?: string;
  is_vip?: boolean;
  puzzleCount: number;
}

export interface CategoryGroup {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  badge?: string;
  color?: string;
  order?: number;
  subtopics: TopicSummary[];
}

export interface PublicPuzzle {
  id: string;
  prompt: string;
  image_url?: string;
  answer_type: AnswerType;
}
