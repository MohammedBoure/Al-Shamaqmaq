import { PublicPuzzle, TopicSummary } from './topics';

export type GamePhase =
  | 'LOBBY'
  | 'TOPIC_SELECTION'
  | 'ANSWERING'
  | 'VOTING'
  | 'ROUND_RESULTS'
  | 'GAME_OVER';

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
}

export interface PlayerAnswerState {
  initialAnswer: string;
  isCorrect: boolean;
  bluffAnswer: string | null;
  hasSubmittedInitial: boolean;
  hasSubmittedBluff: boolean;
  submittedAt: number;
}

export interface InternalVotingOption {
  id: string;
  text: string;
  authorPlayerIds: string[]; // Supports single or merged authors if duplicates are merged
  isCorrect: boolean;
}

export interface PublicVotingOption {
  id: string;
  text: string;
  isSelfSubmission: boolean;
}

export interface PlayerVote {
  playerId: string;
  optionId: string;
  votedAt: number;
}

export interface RoundResultVoter {
  id: string;
  nickname: string;
  avatar: string;
}

export interface RoundResultOption {
  id: string;
  text: string;
  isCorrect: boolean;
  authors: Array<{ id: string; nickname: string; avatar: string }>;
  votes: RoundResultVoter[];
}

export interface RoundScoreDetail {
  playerId: string;
  nickname: string;
  avatar: string;
  votedForCorrect: boolean;
  correctPoints: number;
  fooledPlayerCount: number;
  fooledPlayerNames: string[];
  deceptionPoints: number;
  roundPoints: number;
  totalScore: number;
}

export interface RoundResult {
  roundNumber: number;
  puzzleId: string;
  prompt: string;
  correctAnswer: string;
  options: RoundResultOption[];
  scoreBreakdown: RoundScoreDetail[];
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
}

export interface RoomSettings {
  allowedTopicIds: string[];
  totalRounds: number;
  topicPickDuration: number;
  answerDuration: number;
  bluffDuration: number;
  voteDuration: number;
  revealDuration: number;
}

export interface RoomPublicState {
  code: string;
  phase: GamePhase;
  hostId: string;
  players: PlayerProfile[];
  currentRound: number;
  totalRounds: number;
  currentPickerId: string | null;
  allowedTopicIds: string[];
  timeRemaining: number;
  currentTopicTitle: string | null;
  currentPrompt: string | null;
}
