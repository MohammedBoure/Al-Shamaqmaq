import { PublicPuzzle, TopicSummary } from './topics';

export type GamePhase =
  | 'LOBBY'
  | 'TOPIC_SELECTION'
  | 'ANSWERING'
  | 'VOTING'
  | 'ROUND_RESULTS'
  | 'GAME_OVER';

export interface TeamConfig {
  id: string;
  name: string;
  color: string;
  maxPlayers: number;
}

export const DEFAULT_TEAMS: TeamConfig[] = [
  { id: 'red', name: 'صقور اللهب', color: '#ef4444', maxPlayers: 5 },
  { id: 'blue', name: 'ذئاب الموج', color: '#3b82f6', maxPlayers: 5 },
  { id: 'green', name: 'أفاعي الزمرد', color: '#10b981', maxPlayers: 5 },
  { id: 'gold', name: 'أسود الذهب', color: '#f59e0b', maxPlayers: 5 },
  { id: 'purple', name: 'أشباح الظلام', color: '#a855f7', maxPlayers: 5 },
  { id: 'cyan', name: 'فرسان الجليد', color: '#06b6d4', maxPlayers: 5 },
  { id: 'orange', name: 'نمور البركان', color: '#f97316', maxPlayers: 5 },
  { id: 'pink', name: 'ثعالب السراب', color: '#ec4899', maxPlayers: 5 },
];

export interface TeamAnswerCandidate {
  id: string;
  text: string;
  authorId: string;
  authorNickname: string;
  authorAvatar: string;
  voterIds: string[];
}

export interface TeamRoundState {
  teamId: string;
  teamName: string;
  teamColor: string;
  hasCorrectAnswer: boolean;
  correctAnswerText: string | null;
  correctFinderId: string | null;
  correctFinderNickname: string | null;
  candidates: TeamAnswerCandidate[];
  selectedCandidateId: string | null;
  submittedPlayerIds: string[];
  isTeamVotingPhase?: boolean;
}

export type CheatType = 'TAB_SWITCH' | 'WINDOW_BLUR' | 'SCREENSHOT' | 'COPY_PASTE';

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  teamId?: string | null;
  isBot?: boolean;
  cheatCount?: number;
  lastCheatType?: CheatType | null;
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
  teamId?: string | null;
  teamName?: string | null;
  teamColor?: string | null;
}

export interface PublicVotingOption {
  id: string;
  text: string;
  isSelfSubmission: boolean;
  teamId?: string | null;
  isTeamCorrectHint?: boolean;
  teamVoters?: RoundResultVoter[];
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
  teamId?: string | null;
}

export interface RoundResultOption {
  id: string;
  text: string;
  isCorrect: boolean;
  authors: Array<{ id: string; nickname: string; avatar: string; teamId?: string | null }>;
  votes: RoundResultVoter[];
  teamId?: string | null;
  teamName?: string | null;
  teamColor?: string | null;
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
  teamId?: string | null;
  cheatCount?: number;
}

export interface TeamScoreEntry {
  teamId: string;
  teamName: string;
  teamColor: string;
  score: number;
  playerCount: number;
  maxPlayers: number;
  rank: number;
}

export interface RoundResult {
  roundNumber: number;
  puzzleId: string;
  prompt: string;
  correctAnswer: string;
  options: RoundResultOption[];
  scoreBreakdown: RoundScoreDetail[];
  teamScores?: TeamScoreEntry[];
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  teamId?: string | null;
  cheatCount?: number;
}

export type GameMode = 'individual' | 'teams';

export interface RoomSettings {
  allowedTopicIds: string[];
  totalRounds: number;
  topicPickDuration: number;
  answerDuration: number;
  bluffDuration: number;
  voteDuration: number;
  revealDuration: number;
  maxPlayers: number;
  gameMode: GameMode;
  teamCount: number;
  teams: TeamConfig[];
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
  roundDuration: number;
  maxPlayers: number;
  gameMode: GameMode;
  teamCount: number;
  teams: TeamConfig[];
  teamScores?: TeamScoreEntry[];
}
