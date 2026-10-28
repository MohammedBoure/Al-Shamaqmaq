import {
  GamePhase,
  PlayerProfile,
  PublicVotingOption,
  RoundResult,
  LeaderboardEntry,
  RoomPublicState,
  TeamConfig,
  TeamRoundState,
  CheatType,
} from './game';
import { PublicPuzzle, TopicSummary } from './topics';

// Client to Server Actions
export type ClientMessageType =
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'KICK_PLAYER'
  | 'ABORT_GAME'
  | 'REMATCH'
  | 'UPDATE_PROFILE'
  | 'JOIN_TEAM'
  | 'UPDATE_SETTINGS'
  | 'START_GAME'
  | 'SELECT_TOPIC'
  | 'SUBMIT_ANSWER'
  | 'SUBMIT_BLUFF'
  | 'SUBMIT_TEAM_VOTE'
  | 'SUBMIT_VOTE'
  | 'REPORT_CHEAT'
  | 'NEXT_ROUND'
  | 'ADD_BOT'
  | 'REMOVE_BOT'
  | 'PING';

export interface KickPlayerPayload {
  targetPlayerId: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  avatar: string;
  sessionToken?: string;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatar?: string;
  teamId?: string | null;
}

export interface JoinTeamPayload {
  teamId: string;
}

export interface UpdateSettingsPayload {
  allowedTopicIds?: string[];
  totalRounds?: number;
  topicPickDuration?: number;
  answerDuration?: number;
  bluffDuration?: number;
  voteDuration?: number;
  revealDuration?: number;
  maxPlayers?: number;
  gameMode?: 'individual' | 'teams';
  teamCount?: number;
  teams?: TeamConfig[];
  teamIdToUpdate?: {
    id: string;
    name?: string;
    maxPlayers?: number;
  };
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

export interface SubmitTeamVotePayload {
  candidateId: string;
}

export interface SubmitVotePayload {
  optionId: string;
}

export interface ReportCheatPayload {
  cheatType: CheatType;
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
  | 'KICKED'
  | 'MATCH_ABORTED'
  | 'REMATCH_STARTED'
  | 'LEFT_ROOM'
  | 'GAME_STARTED'
  | 'PHASE_CHANGED'
  | 'TOPIC_SELECTION_STARTED'
  | 'ROUND_STARTED'
  | 'ANSWER_FEEDBACK'
  | 'ANSWER_PROGRESS'
  | 'BLUFF_REQUESTED'
  | 'TEAM_ROUND_STATE_UPDATED'
  | 'VOTING_STARTED'
  | 'VOTE_PROGRESS'
  | 'TEAM_VOTES_UPDATED'
  | 'ROUND_RESULTS_ANNOUNCED'
  | 'GAME_OVER_ANNOUNCED'
  | 'CHEAT_DETECTED'
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

export interface TeamRoundStateUpdatedPayload {
  teamState: TeamRoundState;
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

export interface CheatDetectedPayload {
  playerId: string;
  nickname: string;
  avatar: string;
  cheatType: CheatType;
  cheatCount: number;
  message: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}
