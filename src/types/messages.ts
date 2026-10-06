import { GamePhase, PlayerProfile, PublicVotingOption, RoundResult, LeaderboardEntry, RoomPublicState } from './game';
import { PublicPuzzle, TopicSummary } from './topics';

// Client to Server Actions
export type ClientMessageType =
  | 'JOIN_ROOM'
  | 'UPDATE_PROFILE'
  | 'UPDATE_SETTINGS'
  | 'START_GAME'
  | 'SELECT_TOPIC'
  | 'SUBMIT_ANSWER'
  | 'SUBMIT_BLUFF'
  | 'SUBMIT_VOTE'
  | 'NEXT_ROUND'
  | 'PING';

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  avatar: string;
  sessionToken?: string;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatar?: string;
}

export interface UpdateSettingsPayload {
  allowedTopicIds?: string[];
  totalRounds?: number;
  topicPickDuration?: number;
  answerDuration?: number;
  bluffDuration?: number;
  voteDuration?: number;
  revealDuration?: number;
}

export interface SelectTopicPayload {
  topicId: string;
}

export interface SubmitAnswerPayload {
  answer: string;
}

export interface SubmitBluffPayload {
  bluff: string;
}

export interface SubmitVotePayload {
  optionId: string;
}

export interface ClientMessage<T = unknown> {
  type: ClientMessageType;
  payload?: T;
}

// Server to Client Events
export type ServerMessageType =
  | 'ROOM_JOINED'
  | 'ROOM_UPDATED'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_UPDATED'
  | 'GAME_STARTED'
  | 'PHASE_CHANGED'
  | 'TOPIC_SELECTION_STARTED'
  | 'ROUND_STARTED'
  | 'ANSWER_FEEDBACK'
  | 'ANSWER_PROGRESS'
  | 'BLUFF_REQUESTED'
  | 'VOTING_STARTED'
  | 'VOTE_PROGRESS'
  | 'ROUND_RESULTS_ANNOUNCED'
  | 'GAME_OVER_ANNOUNCED'
  | 'TIMER_TICK'
  | 'ERROR'
  | 'PONG';

export interface ServerMessage<T = unknown> {
  type: ServerMessageType;
  payload: T;
}

export interface RoomJoinedPayload {
  sessionToken: string;
  player: PlayerProfile;
  room: RoomPublicState;
  topics: TopicSummary[];
}

export interface TopicSelectionStartedPayload {
  currentPickerId: string;
  pickerNickname: string;
  allowedTopics: TopicSummary[];
  timeRemaining: number;
}

export interface RoundStartedPayload {
  roundNumber: number;
  totalRounds: number;
  topicId: string;
  topicTitle: string;
  puzzle: PublicPuzzle;
  timeRemaining: number;
}

export interface AnswerFeedbackPayload {
  isCorrect: boolean;
  message: string;
  requiresBluff: boolean;
}

export interface BluffRequestedPayload {
  prompt: string;
  timeRemaining: number;
  instruction: string;
}

export interface ProgressPayload {
  submittedCount: number;
  totalPlayers: number;
  submittedPlayerIds: string[];
}

export interface VotingStartedPayload {
  prompt: string;
  options: PublicVotingOption[];
  timeRemaining: number;
}

export interface RoundResultsPayload {
  result: RoundResult;
  leaderboard: LeaderboardEntry[];
  isLastRound: boolean;
  timeRemaining: number;
}

export interface GameOverPayload {
  leaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
