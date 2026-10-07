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
  teamId?: string | null;
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
  answer_type: string;
}

export interface PublicVotingOption {
  id: string;
  text: string;
  isSelfSubmission: boolean;
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
  teamId?: string | null;
}

export interface TeamScoreEntry {
  teamId: string;
  teamName: string;
  teamColor: string;
  score: number;
  playerCount: number;
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
}

export type GameMode = 'individual' | 'teams';

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
  roundDuration?: number;
  maxPlayers?: number;
  gameMode?: GameMode;
  teamScores?: TeamScoreEntry[];
}

