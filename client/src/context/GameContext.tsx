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

  // مرحلة الإجابة والخداع
  currentPuzzle: PublicPuzzle | null;
  currentTopicTitle: string | null;
  currentRound: number;
  totalRounds: number;
  answerFeedback: { isCorrect: boolean; message: string; requiresBluff: boolean } | null;
  requiresBluff: boolean;
  hasSubmittedInitial: boolean;
  hasSubmittedBluff: boolean;

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
    }
  ) => Promise<boolean>;
  joinRoom: (roomCode: string, nickname: string, avatar: string) => void;
  updateProfile: (nickname?: string, avatar?: string, teamId?: string | null) => void;
  updateSettings: (settings: {
    allowedTopicIds?: string[];
    totalRounds?: number;
    answerDuration?: number;
    maxPlayers?: number;
    gameMode?: 'individual' | 'teams';
  }) => void;
  startGame: () => void;
  selectTopic: (topicId: string) => void;
  submitAnswer: (answer: string) => void;
  submitBluff: (bluff: string) => void;
  submitVote: (optionId: string) => void;
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

  // مرحلة اختيار الموضوع
  const [currentPickerId, setCurrentPickerId] = useState<string | null>(null);
  const [pickerNickname, setPickerNickname] = useState<string | null>(null);
  const [allowedTopics, setAllowedTopics] = useState<TopicSummary[]>([]);

  // مرحلة الإجابة
  const [currentPuzzle, setCurrentPuzzle] = useState<PublicPuzzle | null>(null);
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; message: string; requiresBluff: boolean } | null>(null);
  const [requiresBluff, setRequiresBluff] = useState<boolean>(false);
  const [hasSubmittedInitial, setHasSubmittedInitial] = useState<boolean>(false);
  const [hasSubmittedBluff, setHasSubmittedBluff] = useState<boolean>(false);

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
        if (player && player.id === payload.player.id) {
          setPlayer(payload.player);
        }
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

        // مزامنة قائمة اللاعبين ونقاطهم للجولة الجديدة إن وجدت
        if (payload.players && Array.isArray(payload.players)) {
          setRoom((prev) => prev ? { ...prev, players: payload.players } : null);
        }

        // تصفير حالات الجولة
        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
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

        audio.playClick();
        haptic.triggerHaptic('medium');
        break;
      }

      case 'ANSWER_FEEDBACK': {
        setAnswerFeedback(payload);
        setHasSubmittedInitial(true);

        if (payload.isCorrect) {
          setRequiresBluff(true);
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

      case 'ROUND_RESULTS_ANNOUNCED': {
        setPhase('ROUND_RESULTS');
        setRoundResult(payload.result);
        setLeaderboard(payload.leaderboard);
        setIsLastRound(payload.isLastRound);
        setTimeRemaining(payload.timeRemaining);

        // مزامنة نقاط اللاعبين داخل الغرفة لمطابقة شريط النقاط فورياً
        if (payload.leaderboard && Array.isArray(payload.leaderboard)) {
          const scoreMap = new Map<string, number>(payload.leaderboard.map((l: any) => [l.id, l.score]));
          setRoom((prev) => {
            if (!prev) return null;
            return {
              ...prev,
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

        // تشغيل صوت النصر والتصفيق
        audio.playVictoryFanfare();
        haptic.triggerHaptic('success');
        break;
      }

      case 'GAME_OVER_ANNOUNCED': {
        setPhase('GAME_OVER');
        setLeaderboard(payload.leaderboard);
        setWinner(payload.winner);

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
        setHasVoted(false);
        setVotedOptionId(null);
        setRoundResult(null);
        break;
      }

      case 'REMATCH_STARTED': {
        triggerToast(payload.message || 'تم بدء إعادة المباراة! استعدوا للجولة الأولى 🎭', false);
        setPhase('LOBBY');
        setAnswerFeedback(null);
        setRequiresBluff(false);
        setHasSubmittedInitial(false);
        setHasSubmittedBluff(false);
        setHasVoted(false);
        setVotedOptionId(null);
        setRoundResult(null);
        setLeaderboard([]);
        setWinner(null);
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
          // إذا فشلت محاولة إعادة الاتصال لأن الغرفة انتهت، نمسح بيانات الجلسة القديمة فوراً
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
  }, [audio, haptic, player, triggerToast]);

  const { status: wsStatus, send } = useWebSocket({
    onMessage: handleServerMessage,
    onOpen: () => {
      // عند فتح الاتصال، إذا كان لدينا كود غرفة و sessionToken مخزن، نحاول إعادة الاتصال فوراً
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

  // جلب ملخص المواضيع والفئات المتاحة عند التحميل الأولي عبر REST API
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

  // دالة إنشاء غرفة جديدة عبر REST API ثم الربط بالـ WebSocket
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
        setPhase('LOBBY');

        localStorage.setItem('deception_session_token', data.sessionToken);
        localStorage.setItem('deception_room_code', data.roomCode);

        // ربط المقبس بالـ sessionToken
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

  // دالة الانضمام لغرفة
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

  // دالة تعديل الملف الشخصي
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

  // دالة تعديل إعدادات الغرفة
  const updateSettings = useCallback(
    (settings: {
      allowedTopicIds?: string[];
      totalRounds?: number;
      answerDuration?: number;
      maxPlayers?: number;
      gameMode?: 'individual' | 'teams';
    }) => {
      audio.playClick();
      send({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });
    },
    [audio, send]
  );

  // بدء اللعبة
  const startGame = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({ type: 'START_GAME' });
  }, [audio, haptic, send]);

  // اختيار موضوع الجولة
  const selectTopic = useCallback((topicId: string) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({
      type: 'SELECT_TOPIC',
      payload: { topicId },
    });
  }, [audio, haptic, send]);

  // إرسال الإجابة
  const submitAnswer = useCallback((answer: string) => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({
      type: 'SUBMIT_ANSWER',
      payload: { answer: answer.trim() },
    });
  }, [audio, haptic, send]);

  // إرسال الإجابة المزيفة
  const submitBluff = useCallback((bluff: string) => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({
      type: 'SUBMIT_BLUFF',
      payload: { bluff: bluff.trim() },
    });
    setHasSubmittedBluff(true);
  }, [audio, haptic, send]);

  // إرسال التصويت
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

  // الانتقال للجولة التالية
  const nextRound = useCallback(() => {
    audio.playClick();
    send({ type: 'NEXT_ROUND', payload: {} });
  }, [audio, send]);

  // مغادرة الغرفة
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

  // طرد لاعب بواسطة المضيف
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

  // إنهاء المباراة الحالية والعودة لغرفة الانتظار
  const abortGame = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('heavy');
    send({ type: 'ABORT_GAME', payload: {} });
  }, [audio, haptic, send]);

  // إعادة التحدي وبدء مباراة جديدة
  const rematch = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('success');
    send({ type: 'REMATCH', payload: {} });
  }, [audio, haptic, send]);

  // إضافة روبوت تجريبي للمساعدة في تجربة اللعبة
  const addBot = useCallback(() => {
    audio.playClick();
    haptic.triggerHaptic('medium');
    send({ type: 'ADD_BOT', payload: {} });
  }, [audio, haptic, send]);

  // إزالة روبوت تجريبي
  const removeBot = useCallback(
    (botId?: string) => {
      audio.playClick();
      haptic.triggerHaptic('light');
      send({ type: 'REMOVE_BOT', payload: { botId } });
    },
    [audio, haptic, send]
  );

  // تبديل اختيار موضوع مسموح به
  const toggleAllowedTopic = useCallback(
    (topicId: string) => {
      audio.playClick();
      // إذا كانت المصفوفة معرفة (حتى وإن كانت فارغة []) نعتمد عليها
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

  // تعيين قائمة المعرفات المسموحة دفعة واحدة
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
        votingOptions,
        votingPrompt,
        hasVoted,
        votedOptionId,
        roundResult,
        leaderboard,
        winner,
        isLastRound,
        audio,
        haptic,
        createRoom,
        joinRoom,
        updateProfile,
        updateSettings,
        startGame,
        selectTopic,
        submitAnswer,
        submitBluff,
        submitVote,
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
