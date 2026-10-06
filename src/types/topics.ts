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
  puzzles: Puzzle[];
}

export interface TopicSummary {
  id: string;
  title: string;
  description: string;
  puzzleCount: number;
}

export interface PublicPuzzle {
  id: string;
  prompt: string;
  image_url?: string;
  answer_type: AnswerType;
}
