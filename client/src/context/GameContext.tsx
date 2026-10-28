import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  GamePhase,
  PlayerProfile,
  TopicSummary,
  PublicPuzzle,
  PublicVotingOption,
  RoundResult,
  LeaderboardEntry,
  RoomPublicState,
  CategoryGroup,
  TeamConfig,
  TeamRoundState,
  TeamScoreEntry,
  CheatType,
  CheatAlert,
} from '../types';
import { useWebSocket, WsStatus } from '../hooks/useWebSocket';
import { useAudio } from '../hooks/useAudio';
import { useHaptic } from '../hooks/useHaptic';

interface GameContextType {
  // الحالات العامة
  phase: GamePhase;
  player: PlayerProfile | null;
  sessionToken: string | null;
  roomCode: string | null;
  room: RoomPublicState | null;
  topics: TopicSummary[];
  categoryGroups: CategoryGroup[];
  timeRemaining: number;
  wsStatus: WsStatus;

  // إشعارات وتنبيهات
  errorMessage: string | null;
  successMessage: string | null;
  clearError: () => void;

  // مرحلة اختيار الموضوع
  currentPickerId: string | null;
  pickerNickname: string | null;
  allowedTopics: TopicSummary[];

  // مرحلة الإجابة والخداع والفرق
  currentPuzzle: PublicPuzzle | null;
  currentTopicTitle: string | null;
  currentRound: number;
  totalRounds: number;
  answerFeedback: { isCorrect: boolean; message: string; requiresBluff: boolean } | null;
  requiresBluff: boolean;
  hasSubmittedInitial: boolean;
  hasSubmittedBluff: boolean;
  teamRoundState: TeamRoundState | null;
  teamScores: TeamScoreEntry[];

  // مرحلة التصويت
  votingOptions: PublicVotingOption[];
  votingPrompt: string | null;
  hasVoted: boolean;
  votedOptionId: string | null;

  // مرحلة النتائج والنهاية
  roundResult: RoundResult | null;
  leaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry | null;
  isLastRound: boolean;
  cheatAlerts: CheatAlert[];

  // الصوت والاهتزاز
  audio: ReturnType<typeof useAudio>;
  haptic: ReturnType<typeof useHaptic>;

  // العمليات والأوامر
  createRoom: (
    hostNickname: string,
    hostAvatar: string,
    allowedTopicIds?: string[],
    initialSettings?: {
      totalRounds?: number;
      answerDuration?: number;
      maxPlayers?: number;
      gameMode?: 'individual' | 'teams';
      teamCount?: number;
      teams?: TeamConfig[];
    }
  ) => Promise<boolean>;
  joinRoom: (roomCode: string, nickname: string, avatar: string) => void;
  updateProfile: (nickname?: string, avatar?: string, teamId?: string | null) => void;
  joinTeam: (teamId: string) => void;
  updateSettings: (settings: {
    allowedTopicIds?: string[];
    totalRounds?: number;
    answerDuration?: number;
    maxPlayers?: number;
    gameMode?: 'individual' | 'teams';
    teamCount?: number;
    teams?: TeamConfig[];
    teamIdToUpdate?: {
      id: string;
      name?: string;
      maxPlayers?: number;
    };
  }) => void;
  startGame: () => void;
  selectTopic: (topicId: string) => void;
  submitAnswer: (answer: string) => void;
  submitBluff: (bluff: string) => void;
  submitTeamVote: (candidateId: string) => void;
  submitVote: (optionId: string) => void;
  reportCheat: (cheatType: CheatType) => void;
  nextRound: () => void;
  leaveRoom: () => void;
  kickPlayer: (targetPlayerId: string) => void;
  abortGame: () => void;
  rematch: () => void;
  addBot: () => void;
  removeBot: (botId?: string) => void;
  toggleAllowedTopic: (topicId: string) => void;
  setAllowedTopicIdsList: (topicIds: string[]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audio = useAudio();
  const haptic = useHaptic();

  // استرجاع البيانات المحفوظة محلياً لاستعادة الجلسة
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('deception_session_token'));
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem('deception_room_code'));
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [room, setRoom] = useState<RoomPublicState | null>(null);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cheatAlerts, setCheatAlerts] = useState<CheatAlert[]>([]);

  // مرحلة اختيار الموضوع
  const [currentPickerId, setCurrentPickerId] = useState<string | null>(null);
  const [pickerNickname, setPickerNickname] = useState<string | null>(null);
  const [allowedTopics, setAllowedTopics] = useState<TopicSummary[]>([]);

  // مرحلة الإجابة والفرق
  const [currentPuzzle, setCurrentPuzzle] = useState<PublicPuzzle | null>(null);
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; message: string; requiresBluff: boolean } | null>(null);
  const [requiresBluff, setRequiresBluff] = useState<boolean>(false);
  const [hasSubmittedInitial, setHasSubmittedInitial] = useState<boolean>(false);
  const [hasSubmittedBluff, setHasSubmittedBluff] = useState<boolean>(false);
  const [teamRoundState, setTeamRoundState] = useState<TeamRoundState | null>(null);
  const [teamScores, setTeamScores] = useState<TeamScoreEntry[]>([]);

  // مرحلة التصويت
  const [votingOptions, setVotingOptions] = useState<PublicVotingOption[]>([]);
  const [votingPrompt, setVotingPrompt] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  // مرحلة النتائج
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winner, setWinner] = useState<LeaderboardEntry | null>(null);
  const [isLastRound, setIsLastRound] = useState<boolean>(false);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const triggerToast = useCallback((msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      haptic.triggerHaptic('error');
    } else {
      setSuccessMessage(msg);
      haptic.triggerHaptic('success');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  }, [haptic]);

  // معالجة رسائل السيرفر الواردة عبر الـ WebSocket
  const handleServerMessage = useCallback((message: { type: string; payload: any }) => {
    const { type, payload } = message;

    switch (type) {
      case 'ROOM_JOINED': {
        setSessionToken(payload.sessionToken);
        setPlayer(payload.player);
        setRoom(payload.room);
        setPhase(payload.room.phase);
        setRoomCode(payload.room.code);
        setTimeRemaining(payload.room.timeRemaining);
        setCurrentRound(payload.room.currentRound);
        setTotalRounds(payload.room.totalRounds);
        if (payload.room.teamScores) setTeamScores(payload.room.teamScores);
        if (payload.topics) setTopics(payload.topics);

        localStorage.setItem('deception_session_token', payload.sessionToken);
        localStorage.setItem('deception_room_code', payload.room.code);
        audio.playClick();
        break;
      }

      case 'ROOM_UPDATED': {
        setRoom(payload.room);
        setPhase(payload.room.phase);
        setTimeRemaining(payload.room.timeRemaining);
        if (payload.room.teamScores) {
          setTeamScores(payload.room.teamScores);
        } else if (payload.room.gameMode === 'individual') {
          setTeamScores([]);
        }
        setPlayer((prev) => {
          if (!prev) return null;
          const updatedSelf = payload.room.players?.find((p: PlayerProfile) => p.id === prev.id);
          return updatedSelf || prev;
        });
        break;
      }

      case 'PLAYER_JOINED': {
        setRoom((prev) => prev ? { ...prev, players: [...prev.players.filter(p => p.id !== payload.player.id), payload.player] } : null);
        audio.playClick();
        break;
      }

      case 'PLAYER_UPDATED': {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map((p) => (p.id === payload.player.id ? payload.player : p)),
          };
        });
        setPlayer((prev) => (prev && prev.id === payload.player.id ? payload.player : prev));
        break;
      }

      case 'PLAYER_LEFT': {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.filter((p) => p.id !== payload.playerId),
          };
        });
        break;
      }

      case 'TOPIC_SELECTION_STARTED': {
        setPhase('TOPIC_SELECTION');
        setCurrentPickerId(payload.currentPickerId);
        setPickerNickname(payload.pickerNickname);
        setAllowedTopics(payload.allowedTopics);
        setTimeRemaining(payload.timeRemaining);
        if (payload.teamScores) setTeamScores(payload.teamScores);

        if (payload.players && Array.isArray(payload.players)) {
          setRoom((prev) => prev ? { ...prev, players: payload.players, teamScores: payload.teamScores ?? prev.teamScores } : null);
        }

        // تصفير حالات الجولة
        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
        setTeamRoundState(null);
        setHasVoted(false);
        setVotedOptionId(null);
        setRoundResult(null);

        audio.playClick();
        haptic.triggerHaptic('medium');
        break;
      }

      case 'ROUND_STARTED': {
        setPhase('ANSWERING');
        setCurrentRound(payload.roundNumber);
        setTotalRounds(payload.totalRounds);
        setCurrentTopicTitle(payload.topicTitle);
        setCurrentPuzzle(payload.puzzle);
        setTimeRemaining(payload.timeRemaining);

        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
        setTeamRoundState(null);

        audio.playClick();
        haptic.triggerHaptic('medium');
        break;
      }

      case 'TEAM_ROUND_STATE_UPDATED': {
        if (payload.teamState) {
          setTeamRoundState((prev) => {
            if (!prev?.hasCorrectAnswer && payload.teamState.hasCorrectAnswer) {
              audio.playCorrect();
              haptic.triggerHaptic('success');
            }
            return payload.teamState;
          });
        }
        break;
      }

      case 'ANSWER_FEEDBACK': {
        setAnswerFeedback(payload);
        setHasSubmittedInitial(true);

        if (payload.isCorrect) {
          setRequiresBluff(payload.requiresBluff);
          if (!payload.requiresBluff) {
            setHasSubmittedBluff(true);
          }
          audio.playCorrect();
          haptic.triggerHaptic('success');
        } else {
          setRequiresBluff(false);
          setHasSubmittedBluff(true);
          audio.playBluffSecret();
          haptic.triggerHaptic('light');
        }
        break;
      }

      case 'BLUFF_REQUESTED': {
        setRequiresBluff(true);
        audio.playCorrect();
        haptic.triggerHaptic('success');
        break;
      }

      case 'VOTING_STARTED': {
        setPhase('VOTING');
        setVotingPrompt(payload.prompt);
        setVotingOptions(payload.options);
        setTimeRemaining(payload.timeRemaining);
        setHasVoted(false);
        setVotedOptionId(null);

        audio.playClick();
        haptic.triggerHaptic('heavy');
        break;
      }

      case 'TEAM_VOTES_UPDATED': {
        if (payload.teamVotes) {
          setVotingOptions((prev) =>
            prev.map((opt) => ({
              ...opt,
              teamVoters: payload.teamVotes[opt.id] || [],
            }))
          );
        }
        break;
      }

      case 'ROUND_RESULTS_ANNOUNCED': {
        setPhase('ROUND_RESULTS');
        setRoundResult(payload.result);
        setLeaderboard(payload.leaderboard);
        setIsLastRound(payload.isLastRound);
        setTimeRemaining(payload.timeRemaining);
        if (payload.teamScores) {
          setTeamScores(payload.teamScores);
        } else if (payload.result?.teamScores) {
          setTeamScores(payload.result.teamScores);
        }

        if (payload.leaderboard && Array.isArray(payload.leaderboard)) {
          const scoreMap = new Map<string, number>(payload.leaderboard.map((l: any) => [l.id, l.score]));
          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              teamScores: payload.teamScores ?? payload.result?.teamScores ?? prev.teamScores,
              players: prev.players.map((p) => ({
                ...p,
                score: scoreMap.has(p.id) ? (scoreMap.get(p.id) ?? p.score) : p.score,
              })),
            };
          });
          setPlayer((prev) => {
            if (!prev || !scoreMap.has(prev.id)) return prev;
            return { ...prev, score: scoreMap.get(prev.id)! };
          });
        }

        audio.playVictoryFanfare();
        haptic.triggerHaptic('success');
        break;
      }

      case 'GAME_OVER_ANNOUNCED': {
        setPhase('GAME_OVER');
        setLeaderboard(payload.leaderboard);
        setWinner(payload.winner);
        setCheatAlerts([]);
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                teamScores: payload.teamScores ?? prev.teamScores,
                players: prev.players.map((p) => ({ ...p, cheatCount: 0, lastCheatType: null })),
              }
            : null
        );
        setPlayer((prev) => (prev ? { ...prev, cheatCount: 0, lastCheatType: null } : null));
        if (payload.teamScores) {
          setTeamScores(payload.teamScores);
        }

        audio.playVictoryFanfare();
        haptic.triggerHaptic('success');
        break;
      }

      case 'TIMER_TICK': {
        setTimeRemaining(payload.timeRemaining);
        if (payload.timeRemaining <= 10 && payload.timeRemaining > 0) {
          audio.playTimerTick(true);
          haptic.triggerHaptic('warning');
        } else if (payload.timeRemaining % 10 === 0 && payload.timeRemaining > 0) {
          audio.playTimerTick(false);
        }
        break;
      }

      case 'KICKED': {
        triggerToast(payload.reason || 'تم طردك من الجلسة بواسطة المضيف', true);
        localStorage.removeItem('deception_session_token');
        localStorage.removeItem('deception_room_code');
        setSessionToken(null);
        setRoomCode(null);
        setPlayer(null);
        setRoom(null);
        setPhase('LOBBY');
        break;
      }

      case 'MATCH_ABORTED': {
        triggerToast(payload.reason || 'قام المضيف بإنهاء المباراة الحالية والعودة لغرفة الانتظار', false);
        setPhase('LOBBY');
        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
        setTeamRoundState(null);
        setHasVoted(false);
        setVotedOptionId(null);
        setRoundResult(null);
        setCheatAlerts([]);
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                players: prev.players.map((p) => ({ ...p, cheatCount: 0, lastCheatType: null })),
              }
            : null
        );
        setPlayer((prev) => (prev ? { ...prev, cheatCount: 0, lastCheatType: null } : null));
        break;
      }

      case 'REMATCH_STARTED': {
        triggerToast(payload.message || 'تم بدء إعادة المباراة! استعدوا للجولة الأولى 🎭', false);
        setPhase('LOBBY');
        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
        setTeamRoundState(null);
        setHasVoted(false);
        setVotedOptionId(null);
        setRoundResult(null);
        setLeaderboard([]);
        setWinner(null);
        setCheatAlerts([]);
        break;
      }

      case 'CHEAT_DETECTED': {
        haptic.triggerHaptic('warning');
        audio.playTimerTick(true);
        const alertItem: CheatAlert = {
          id: `${payload.playerId}-${Date.now()}`,
          playerId: payload.playerId,
          nickname: payload.nickname,
          avatar: payload.avatar,
          cheatType: payload.cheatType,
          cheatCount: payload.cheatCount,
          message: payload.message,
          timestamp: Date.now(),
        };
        setCheatAlerts((prev) => [alertItem, ...prev.slice(0, 7)]);
        triggerToast(payload.message, true);
        break;
      }

      case 'LEFT_ROOM': {
        localStorage.removeItem('deception_session_token');
        localStorage.removeItem('deception_room_code');
        setSessionToken(null);
        setRoomCode(null);
        setPlayer(null);
        setRoom(null);
        setPhase('LOBBY');
        break;
      }

      case 'ERROR': {
        if (payload.code === 'JOIN_FAILED' || payload.code === 'NOT_IN_ROOM' || payload.code === 'ROOM_NOT_FOUND') {
          localStorage.removeItem('deception_session_token');
          localStorage.removeItem('deception_room_code');
          setSessionToken(null);
          setRoomCode(null);
          setPlayer(null);
          setRoom(null);
          setPhase('LOBBY');
        }
        triggerToast(payload.message || 'حدث خطأ غير متوقع', true);
        break;
      }

      default:
        break;
    }
  }, [audio, haptic, triggerToast]);

  const { status: wsStatus, send } = useWebSocket({
    onMessage: handleServerMessage,
    onOpen: () => {
      const storedToken = localStorage.getItem('deception_session_token');
      const storedRoom = localStorage.getItem('deception_room_code');
      if (storedToken && storedRoom) {
        send({
          type: 'JOIN_ROOM',
          payload: { roomCode: storedRoom, sessionToken: storedToken },
        });
      }
    },
  });

  useEffect(() => {
    fetch('/api/topics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.topics) {
          setTopics(data.topics);
        }
      })
      .catch((err) => console.error('Failed to load initial topics:', err));

    fetch('/api/topics/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories) {
          setCategoryGroups(data.categories);
        }
      })
      .catch((err) => console.error('Failed to load initial category groups:', err));
  }, []);

  const createRoom = useCallback(
    async (
      hostNickname: string,
      hostAvatar: string,
      allowedTopicIds?: string[],
      initialSettings?: {
        totalRounds?: number;
        answerDuration?: number;
        maxPlayers?: number;
        gameMode?: 'individual' | 'teams';
        teamCount?: number;
        teams?: TeamConfig[];
      }
    ) => {
      try {
        audio.playClick();
        haptic.triggerHaptic('light');

        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostNickname: hostNickname.trim(),
            hostAvatar: hostAvatar.trim(),
            allowedTopicIds: allowedTopicIds && allowedTopicIds.length > 0 ? allowedTopicIds : undefined,
            ...(initialSettings || {}),
          }),
        });

        const data = await res.json();
        if (!data.success) {
          triggerToast(data.error || 'تعذر إنشاء الغرفة', true);
          return false;
        }

        setSessionToken(data.sessionToken);
        setRoomCode(data.roomCode);
        setPlayer(data.player);
        setRoom(data.room);
        if (data.room?.teamScores) setTeamScores(data.room.teamScores);
        setPhase('LOBBY');

        localStorage.setItem('deception_session_token', data.sessionToken);
        localStorage.setItem('deception_room_code', data.roomCode);

        send({
          type: 'JOIN_ROOM',
          payload: { roomCode: data.roomCode, sessionToken: data.sessionToken },
        });

        return true;
      } catch (err: any) {
        triggerToast(err.message || 'حدث خطأ في الاتصال بالخادم', true);
        return false;
      }
    },
    [audio, haptic, send, triggerToast]
  );

  const joinRoom = useCallback((code: string, nickname: string, avatar: string) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    send({
      type: 'JOIN_ROOM',
      payload: {
        roomCode: code.toUpperCase().trim(),
        nickname: nickname.trim(),
        avatar: avatar.trim(),
      },
    });
  }, [audio, haptic, send]);

  const updateProfile = useCallback(
    (nickname?: string, avatar?: string, teamId?: string | null) => {
      audio.playClick();
      send({
        type: 'UPDATE_PROFILE',
        payload: { nickname, avatar, teamId },
      });
    },
    [audio, send]
  );

  const joinTeam = useCallback(
    (teamId: string) => {
      audio.playClick();
      haptic.triggerHaptic('light');
      send({
        type: 'JOIN_TEAM',
        payload: { teamId },
      });
    },
    [audio, haptic, send]
  );

  const updateSettings = useCallback(
    (settings: {
      allowedTopicIds?: string[];
      totalRounds?: number;
      answerDuration?: number;
      maxPlayers?: number;
      gameMode?: 'individual' | 'teams';
      teamCount?: number;
      teams?: TeamConfig[];
      teamIdToUpdate?: {
        id: string;
        name?: string;
        maxPlayers?: number;
      };
    }) => {
      audio.playClick();
      send({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });
    },
    [audio, send]
  );

  const startGame = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({ type: 'START_GAME' });
  }, [audio, haptic, send]);

  const selectTopic = useCallback((topicId: string) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({
      type: 'SELECT_TOPIC',
      payload: { topicId },
    });
  }, [audio, haptic, send]);

  const submitAnswer = useCallback((answer: string) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({
      type: 'SUBMIT_ANSWER',
      payload: { answer: answer.trim() },
    });
  }, [audio, haptic, send]);

  const submitBluff = useCallback((bluff: string) => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({
      type: 'SUBMIT_BLUFF',
      payload: { bluff: bluff.trim() },
    });
    setHasSubmittedBluff(true);
  }, [audio, haptic, send]);

  const submitTeamVote = useCallback((candidateId: string) => {
    audio.playClick();
    haptic.triggerHaptic('light');
    send({
      type: 'SUBMIT_TEAM_VOTE',
      payload: { candidateId },
    });
  }, [audio, haptic, send]);

  const submitVote = useCallback((optionId: string) => {
    audio.playVote();
    haptic.triggerHaptic('heavy');
    setHasVoted(true);
    setVotedOptionId(optionId);
    send({
      type: 'SUBMIT_VOTE',
      payload: { optionId },
    });
  }, [audio, haptic, send]);

  const nextRound = useCallback(() => {
    audio.playClick();
    send({ type: 'NEXT_ROUND', payload: {} });
  }, [audio, send]);

  const leaveRoom = useCallback(() => {
    audio.playClick();
    send({ type: 'LEAVE_ROOM', payload: {} });
    localStorage.removeItem('deception_session_token');
    localStorage.removeItem('deception_room_code');
    setSessionToken(null);
    setRoomCode(null);
    setPlayer(null);
    setRoom(null);
    setPhase('LOBBY');
  }, [audio, send]);

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      audio.playClick();
      haptic.triggerHaptic('medium');
      send({
        type: 'KICK_PLAYER',
        payload: { targetPlayerId },
      });
    },
    [audio, haptic, send]
  );

  const abortGame = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({ type: 'ABORT_GAME', payload: {} });
  }, [audio, haptic, send]);

  const rematch = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('success');
    send({ type: 'REMATCH', payload: {} });
  }, [audio, haptic, send]);

  const addBot = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({ type: 'ADD_BOT', payload: {} });
  }, [audio, haptic, send]);

  const removeBot = useCallback(
    (botId?: string) => {
      audio.playClick();
      haptic.triggerHaptic('light');
      send({ type: 'REMOVE_BOT', payload: { botId } });
    },
    [audio, haptic, send]
  );

  const reportCheat = useCallback(
    (cheatType: CheatType) => {
      send({ type: 'REPORT_CHEAT', payload: { cheatType } });
    },
    [send]
  );

  const toggleAllowedTopic = useCallback(
    (topicId: string) => {
      audio.playClick();
      const current = Array.isArray(room?.allowedTopicIds)
        ? room.allowedTopicIds
        : topics.map((t) => t.id);

      const exists = current.includes(topicId);
      let updated: string[];
      if (exists) {
        updated = current.filter((id) => id !== topicId);
      } else {
        updated = [...current, topicId];
      }

      updateSettings({ allowedTopicIds: updated });
      haptic.triggerHaptic('light');
    },
    [audio, room?.allowedTopicIds, topics, updateSettings, haptic]
  );

  const setAllowedTopicIdsList = useCallback(
    (topicIds: string[]) => {
      audio.playClick();
      updateSettings({ allowedTopicIds: topicIds });
      haptic.triggerHaptic(topicIds.length > 0 ? 'success' : 'medium');
    },
    [audio, updateSettings, haptic]
  );

  return (
    <GameContext.Provider
      value={{
        phase,
        player,
        sessionToken,
        roomCode,
        room,
        topics,
        categoryGroups,
        timeRemaining,
        wsStatus,
        errorMessage,
        successMessage,
        clearError,
        currentPickerId,
        pickerNickname,
        allowedTopics,
        currentPuzzle,
        currentTopicTitle,
        currentRound,
        totalRounds,
        answerFeedback,
        requiresBluff,
        hasSubmittedInitial,
        hasSubmittedBluff,
        teamRoundState,
        teamScores,
        votingOptions,
        votingPrompt,
        hasVoted,
        votedOptionId,
        roundResult,
        leaderboard,
        winner,
        isLastRound,
        cheatAlerts,
        audio,
        haptic,
        createRoom,
        joinRoom,
        updateProfile,
        joinTeam,
        updateSettings,
        startGame,
        selectTopic,
        submitAnswer,
        submitBluff,
        submitTeamVote,
        submitVote,
        reportCheat,
        nextRound,
        leaveRoom,
        kickPlayer,
        abortGame,
        rematch,
        addBot,
        removeBot,
        toggleAllowedTopic,
        setAllowedTopicIdsList,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
