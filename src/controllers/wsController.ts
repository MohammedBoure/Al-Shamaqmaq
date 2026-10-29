import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { roomManager } from '../services/roomManager';
import { topicService } from '../services/topicService';
import { ClientMessage, ServerMessage } from '../types/messages';
import { Room } from '../models/Room';
import { Player } from '../models/Player';

interface SocketMetadata {
  roomCode?: string;
  playerId?: string;
  sessionToken?: string;
}

export class WebSocketController {
  private wss: WebSocketServer;
  private socketMeta: Map<WebSocket, SocketMetadata> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      this.socketMeta.set(ws, {});

      ws.on('message', (data: string | Buffer) => {
        let message: ClientMessage;
        try {
          const rawString = typeof data === 'string' ? data : data.toString('utf-8');
          message = JSON.parse(rawString);
        } catch (err: any) {
          console.error('WebSocket invalid JSON error:', err);
          this.sendError(ws, 'INVALID_JSON', 'الرسالة المرسلة ليست بتنسيق JSON صالح');
          return;
        }

        try {
          this.handleClientMessage(ws, message);
        } catch (err: any) {
          console.error('WebSocket handleClientMessage error:', err);
          this.sendError(ws, 'INTERNAL_ERROR', err?.message || 'حدث خطأ أثناء معالجة الأمر');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
        this.handleDisconnect(ws);
      });
    });
  }

  /**
   * توجيه رسائل العميل إلى المعالجات المناسبة
   */
  private handleClientMessage(ws: WebSocket, message: ClientMessage<any>): void {
    const meta = this.socketMeta.get(ws) || {};

    switch (message.type) {
      case 'PING':
        this.send(ws, { type: 'PONG', payload: { timestamp: Date.now() } });
        break;

      case 'JOIN_ROOM':
        this.handleJoinRoom(ws, message.payload);
        break;

      case 'UPDATE_PROFILE':
        this.handleUpdateProfile(ws, meta, message.payload);
        break;

      case 'JOIN_TEAM':
        this.handleJoinTeam(ws, meta, message.payload);
        break;

      case 'UPDATE_SETTINGS':
        this.handleUpdateSettings(ws, meta, message.payload);
        break;

      case 'START_GAME':
        this.handleStartGame(ws, meta);
        break;

      case 'SELECT_TOPIC':
        this.handleSelectTopic(ws, meta, message.payload);
        break;

      case 'SUBMIT_ANSWER':
        this.handleSubmitAnswer(ws, meta, message.payload);
        break;

      case 'SUBMIT_BLUFF':
        this.handleSubmitBluff(ws, meta, message.payload);
        break;

      case 'SUBMIT_TEAM_VOTE':
        this.handleSubmitTeamVote(ws, meta, message.payload);
        break;

      case 'SUBMIT_VOTE':
        this.handleSubmitVote(ws, meta, message.payload);
        break;

      case 'REPORT_CHEAT':
        this.handleReportCheat(ws, meta, message.payload);
        break;

      case 'NEXT_ROUND':
        this.handleNextRound(ws, meta);
        break;

      case 'LEAVE_ROOM':
        this.handleLeaveRoom(ws, meta);
        break;

      case 'KICK_PLAYER':
        this.handleKickPlayer(ws, meta, message.payload);
        break;

      case 'ABORT_GAME':
        this.handleAbortGame(ws, meta);
        break;

      case 'REMATCH':
        this.handleRematch(ws, meta);
        break;

      case 'ADD_BOT':
        this.handleAddBot(ws, meta);
        break;

      case 'REMOVE_BOT':
        this.handleRemoveBot(ws, meta, message.payload);
        break;

      default:
        this.sendError(ws, 'UNKNOWN_ACTION', `نوع الأمر غير معروف: ${message.type}`);
    }
  }

  /**
   * معالجة انضمام اللاعب للغرفة أو إعادة الاتصال
   */
  private handleJoinRoom(ws: WebSocket, payload: any): void {
    if (!payload || !payload.roomCode) {
      this.sendError(ws, 'BAD_REQUEST', 'كود الغرفة مطلوب');
      return;
    }

    const roomCode = String(payload.roomCode).toUpperCase().trim();
    const sessionToken = payload.sessionToken ? String(payload.sessionToken).trim() : undefined;
    const nickname = payload.nickname ? String(payload.nickname).trim() : 'لاعب';
    const avatar = payload.avatar ? String(payload.avatar).trim() : '🎭';

    // 1. محاولة إعادة الاتصال بواسطة رمز الجلسة (Reconnection)
    if (sessionToken) {
      const session = roomManager.getSession(sessionToken);
      if (session && session.roomCode === roomCode) {
        const room = roomManager.getRoom(roomCode);
        if (room) {
          const player = room.getPlayer(session.playerId);
          if (player) {
            player.attachSocket(ws);
            this.socketMeta.set(ws, { roomCode, playerId: player.id, sessionToken });

            this.send(ws, {
              type: 'ROOM_JOINED',
              payload: {
                sessionToken: player.sessionToken,
                player: player.toProfile(),
                room: room.getPublicState(),
                topics: topicService.getTopicSummaries(),
              },
            });

            this.syncPlayerOnReconnect(player, room);

            room.broadcastExcept(player.id, {
              type: 'PLAYER_UPDATED',
              payload: { player: player.toProfile() },
            });
            return;
          }
        }
      }
    }

    // 2. انضمام كلاعب جديد في الغرفة
    const joinResult = roomManager.joinRoom(roomCode, nickname, avatar);
    if (!joinResult.success || !joinResult.room || !joinResult.player || !joinResult.sessionToken) {
      this.sendError(ws, 'JOIN_FAILED', joinResult.error || 'تعذر الانضمام للغرفة');
      return;
    }

    const { room, player, sessionToken: newSessionToken } = joinResult;
    player.attachSocket(ws);
    this.socketMeta.set(ws, { roomCode: room.code, playerId: player.id, sessionToken: newSessionToken });

    this.send(ws, {
      type: 'ROOM_JOINED',
      payload: {
        sessionToken: newSessionToken,
        player: player.toProfile(),
        room: room.getPublicState(),
        topics: topicService.getTopicSummaries(),
      },
    });

    room.broadcastExcept(player.id, {
      type: 'PLAYER_JOINED',
      payload: { player: player.toProfile() },
    });

    if (room.settings.gameMode === 'teams') {
      room.broadcast({
        type: 'ROOM_UPDATED',
        payload: { room: room.getPublicState() },
      });
    }
  }

  /**
   * مزامنة حالة اللاعب عند إعادة الاتصال في منتصف جولة جارية
   */
  private syncPlayerOnReconnect(player: Player, room: Room): void {
    if (room.phase === 'TOPIC_SELECTION') {
      const allowedTopics = topicService
        .getTopicSummaries()
        .filter((t) => room.settings.allowedTopicIds.includes(t.id));
      const currentPicker = room.getPlayer(room.currentPickerId || '');

      player.send({
        type: 'TOPIC_SELECTION_STARTED',
        payload: {
          currentPickerId: room.currentPickerId,
          pickerNickname: currentPicker ? currentPicker.nickname : 'اللاعب',
          allowedTopics,
          timeRemaining: room.timeRemaining,
          players: room.getPlayerList().map((p) => p.toProfile()),
          teamScores: room.settings.gameMode === 'teams' ? room.getTeamLeaderboard() : undefined,
        },
      });
    } else if (room.phase === 'ANSWERING' && room.currentPuzzle && room.currentTopicId) {
      player.send({
        type: 'ROUND_STARTED',
        payload: {
          roundNumber: room.currentRound,
          totalRounds: room.settings.totalRounds,
          topicId: room.currentTopicId,
          topicTitle: room.currentTopicTitle || '',
          puzzle: {
            id: room.currentPuzzle.id,
            prompt: room.currentPuzzle.prompt,
            image_url: room.currentPuzzle.image_url,
            answer_type: room.currentPuzzle.answer_type,
          },
          timeRemaining: room.timeRemaining,
        },
      });

      if (room.settings.gameMode === 'teams' && player.teamId) {
        const teamState = room.teamRoundStates.get(player.teamId);
        if (teamState) {
          player.send({
            type: 'TEAM_ROUND_STATE_UPDATED',
            payload: { teamState },
          });
        }
      }

      if (player.answerState.hasSubmittedInitial) {
        if (player.answerState.isCorrect && !player.answerState.hasSubmittedBluff) {
          player.send({
            type: 'BLUFF_REQUESTED',
            payload: {
              prompt: room.currentPuzzle.prompt,
              timeRemaining: room.timeRemaining,
              instruction: 'أنت أجبت بشكل صحيح! اكتب إجابة مزيفة مقنعة لتضليل اللاعبين',
            },
          });
        } else {
          player.send({
            type: 'ANSWER_FEEDBACK',
            payload: {
              isCorrect: player.answerState.isCorrect,
              message: player.answerState.isCorrect
                ? 'تم تسجيل إجابتك وخداعك بنجاح'
                : 'تم تسجيل إجابتك كإجابة مضللة',
              requiresBluff: false,
            },
          });
        }
      }
    } else if (room.phase === 'VOTING' && room.currentPuzzle) {
      const playerTeamState =
        room.settings.gameMode === 'teams' && player.teamId
          ? room.teamRoundStates.get(player.teamId)
          : undefined;

      const publicOptions = room.roundOptions.map((opt) => {
        const isOwnTeamOption =
          room.settings.gameMode === 'teams' &&
          Boolean(player.teamId && opt.teamId && player.teamId === opt.teamId);
        return {
          id: opt.id,
          text: opt.text,
          isSelfSubmission: opt.authorPlayerIds.includes(player.id) || isOwnTeamOption,
          teamId: opt.teamId,
          isTeamCorrectHint: Boolean(playerTeamState?.hasCorrectAnswer && opt.isCorrect),
        };
      });

      player.send({
        type: 'VOTING_STARTED',
        payload: {
          prompt: room.currentPuzzle.prompt,
          options: publicOptions,
          timeRemaining: room.timeRemaining,
        },
      });
    } else if (room.phase === 'ROUND_RESULTS' && room.lastRoundResult) {
      player.send({
        type: 'ROUND_RESULTS_ANNOUNCED',
        payload: {
          result: room.lastRoundResult,
          leaderboard: room.getLeaderboard(),
          teamScores: room.settings.gameMode === 'teams' ? room.getTeamLeaderboard() : undefined,
          isLastRound: room.currentRound >= room.settings.totalRounds,
          timeRemaining: room.timeRemaining,
        },
      });
    }
  }

  /**
   * معالجة تحديث الملف الشخصي للاعب (الاسم / الأفاتار / الفريق)
   */
  private handleUpdateProfile(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (payload?.teamId && typeof payload.teamId === 'string') {
      const joinRes = room.joinTeam(player.id, payload.teamId);
      if (!joinRes.success) {
        this.sendError(ws, 'TEAM_FULL', joinRes.error || 'تعذر الانضمام للفريق');
        return;
      }
    }

    const updated = room.updatePlayerProfile(
      player.id,
      payload?.nickname,
      payload?.avatar,
      payload?.teamId
    );
    if (updated) {
      room.broadcast({
        type: 'PLAYER_UPDATED',
        payload: { player: updated.toProfile() },
      });
      if (payload?.teamId !== undefined) {
        room.broadcast({
          type: 'ROOM_UPDATED',
          payload: { room: room.getPublicState() },
        });
      }
    }
  }

  /**
   * معالجة انضمام اللاعب لفريق محدد
   */
  private handleJoinTeam(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || !payload.teamId) {
      this.sendError(ws, 'BAD_REQUEST', 'معرف الفريق مطلوب');
      return;
    }

    const res = room.joinTeam(player.id, String(payload.teamId));
    if (!res.success || !res.player) {
      this.sendError(ws, 'JOIN_TEAM_FAILED', res.error || 'تعذر الانضمام للفريق');
      return;
    }

    room.broadcast({
      type: 'PLAYER_UPDATED',
      payload: { player: res.player.toProfile() },
    });
    room.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: room.getPublicState() },
    });
  }

  /**
   * معالجة تعديل إعدادات الغرفة (المواضيع المسموحة، عدد الجولات، الأوقات، الفرق)
   */
  private handleUpdateSettings(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!player.isHost) {
      this.sendError(ws, 'FORBIDDEN', 'المضيف فقط هو المخول بتعديل إعدادات الغرفة');
      return;
    }

    const success = room.updateSettings(payload || {});
    if (success) {
      room.broadcast({
        type: 'ROOM_UPDATED',
        payload: { room: room.getPublicState() },
      });
    } else {
      this.sendError(ws, 'UPDATE_FAILED', 'تعذر تحديث إعدادات الغرفة');
    }
  }

  /**
   * معالجة بدء اللعبة من المضيف
   */
  private handleStartGame(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!player.isHost) {
      this.sendError(ws, 'FORBIDDEN', 'المضيف فقط هو المخول ببدء اللعبة');
      return;
    }

    const result = room.startGame();
    if (!result.success) {
      this.sendError(ws, 'START_FAILED', result.error || 'تعذر بدء اللعبة');
    }
  }

  /**
   * معالجة اختيار الموضوع للجولة
   */
  private handleSelectTopic(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || !payload.topicId) {
      this.sendError(ws, 'BAD_REQUEST', 'معرف الموضوع (topicId) مطلوب');
      return;
    }

    const result = room.selectTopic(String(payload.topicId), player.id);
    if (!result.success) {
      this.sendError(ws, 'TOPIC_SELECTION_FAILED', result.error || 'فشل اختيار الموضوع');
    }
  }

  /**
   * معالجة إرسال الإجابة الأولية من اللاعب
   */
  private handleSubmitAnswer(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || typeof payload.answer !== 'string') {
      this.sendError(ws, 'BAD_REQUEST', 'نص الإجابة مطلوب');
      return;
    }

    const result = room.submitInitialAnswer(player.id, payload.answer);
    if (!result.success) {
      this.sendError(ws, 'SUBMIT_ANSWER_FAILED', result.error || 'تعذر إرسال الإجابة');
    }
  }

  /**
   * معالجة إرسال الإجابة المزيفة (Bluff)
   */
  private handleSubmitBluff(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || typeof payload.bluff !== 'string') {
      this.sendError(ws, 'BAD_REQUEST', 'نص الإجابة المزيفة مطلوب');
      return;
    }

    const result = room.submitBluff(player.id, payload.bluff);
    if (!result.success) {
      this.sendError(ws, 'SUBMIT_BLUFF_FAILED', result.error || 'تعذر إرسال الإجابة المزيفة');
    }
  }

  /**
   * معالجة تصويت أعضاء الفريق على إجابة الفريق التي ستُعرض للفرق الأخرى
   */
  private handleSubmitTeamVote(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || !payload.candidateId) {
      this.sendError(ws, 'BAD_REQUEST', 'معرف الإجابة المرشحة مطلوب');
      return;
    }

    const result = room.submitTeamVote(player.id, String(payload.candidateId));
    if (!result.success) {
      this.sendError(ws, 'TEAM_VOTE_FAILED', result.error || 'تعذر تسجيل تصويت الفريق');
    }
  }

  /**
   * معالجة إرسال التصويت
   */
  private handleSubmitVote(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || !payload.optionId) {
      this.sendError(ws, 'BAD_REQUEST', 'معرف الخيار (optionId) مطلوب');
      return;
    }

    const result = room.submitVote(player.id, String(payload.optionId));
    if (!result.success) {
      this.sendError(ws, 'VOTE_FAILED', result.error || 'تعذر تسجيل التصويت');
    }
  }

  /**
   * معالجة الإبلاغ التلقائي عن محاولة غش (مغادرة التبويب أو تصوير الشاشة أو النسخ/اللصق)
   */
  private handleReportCheat(_ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player || !payload?.cheatType) return;

    const validTypes = ['TAB_SWITCH', 'WINDOW_BLUR', 'SCREENSHOT', 'COPY_PASTE'];
    const cheatType = String(payload.cheatType);
    if (!validTypes.includes(cheatType)) return;

    room.reportCheat(player.id, cheatType as any);
  }

  /**
   * معالجة طلب الانتقال للجولة التالية مبكراً
   */
  private handleNextRound(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!player.isHost) {
      this.sendError(ws, 'FORBIDDEN', 'المضيف فقط يمكنه تخطي المؤقت والانتقال للجولة التالية');
      return;
    }

    if (room.phase === 'ROUND_RESULTS') {
      room.advanceToNextRoundOrFinish();
    }
  }

  /**
   * معالجة مغادرة اللاعب للغرفة
   */
  private handleLeaveRoom(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    this.socketMeta.delete(ws);

    if (player) {
      player.detachSocket();
    }

    if (meta.sessionToken) {
      roomManager.removeSession(meta.sessionToken);
    }

    if (room && player) {
      const leaveRes = room.leavePlayer(player.id);
      if (leaveRes.shouldDestroy) {
        roomManager.deleteRoom(room.code);
      }
    }

    this.send(ws, {
      type: 'LEFT_ROOM',
      payload: { success: true },
    });
  }

  /**
   * معالجة طرد لاعب بواسطة المضيف
   */
  private handleKickPlayer(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!payload || !payload.targetPlayerId) {
      this.sendError(ws, 'BAD_REQUEST', 'معرف اللاعب المراد طرده مطلوب');
      return;
    }

    const targetId = String(payload.targetPlayerId);
    const targetPlayer = room.getPlayer(targetId);
    if (targetPlayer) {
      if (targetPlayer.sessionToken) {
        roomManager.removeSession(targetPlayer.sessionToken);
      }
      targetPlayer.detachSocket();
    }

    const res = room.kickPlayer(player.id, targetId);
    if (!res.success) {
      this.sendError(ws, 'KICK_FAILED', res.error || 'تعذر طرد اللاعب');
    }
  }

  /**
   * معالجة إنهاء المباراة الجارية والعودة لغرفة الانتظار
   */
  private handleAbortGame(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    const res = room.abortGame(player.id);
    if (!res.success) {
      this.sendError(ws, 'ABORT_FAILED', res.error || 'تعذر إنهاء المباراة');
    }
  }

  /**
   * معالجة إعادة التحدي وبدء مباراة جديدة
   */
  private handleRematch(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    const res = room.rematch(player.id);
    if (!res.success) {
      this.sendError(ws, 'REMATCH_FAILED', res.error || 'تعذر بدء إعادة المباراة');
    }
  }

  /**
   * معالجة إضافة روبوت تجريبي إلى الغرفة
   */
  private handleAddBot(ws: WebSocket, meta: SocketMetadata): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!player.isHost) {
      this.sendError(ws, 'FORBIDDEN', 'المضيف فقط يملك صلاحية إضافة روبوت تجريبي');
      return;
    }

    const res = room.addBot();
    if (!res.success) {
      this.sendError(ws, 'BOT_ADD_FAILED', res.error || 'تعذر إضافة الروبوت');
    }
  }

  /**
   * معالجة إزالة روبوت من الغرفة
   */
  private handleRemoveBot(ws: WebSocket, meta: SocketMetadata, payload?: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    if (!player.isHost) {
      this.sendError(ws, 'FORBIDDEN', 'المضيف فقط يملك صلاحية إزالة الروبوت');
      return;
    }

    const res = room.removeBot(payload?.botId);
    if (!res.success) {
      this.sendError(ws, 'BOT_REMOVE_FAILED', res.error || 'تعذر إزالة الروبوت');
    }
  }

  /**
   * معالجة انقطاع اتصال المقبس
   */
  private handleDisconnect(ws: WebSocket): void {
    const meta = this.socketMeta.get(ws);
    this.socketMeta.delete(ws);

    if (meta && meta.roomCode && meta.playerId) {
      const room = roomManager.getRoom(meta.roomCode);
      if (room) {
        const player = room.getPlayer(meta.playerId);
        if (player) {
          player.detachSocket();

          room.broadcast({
            type: 'PLAYER_UPDATED',
            payload: { player: player.toProfile() },
          });
        }
      }
    }
  }

  /**
   * استخراج كائن الغرفة واللاعب من بيانات الميتا للمقبس
   */
  private getRoomAndPlayer(meta: SocketMetadata): { room?: Room; player?: Player } {
    if (!meta.roomCode || !meta.playerId) return {};
    const room = roomManager.getRoom(meta.roomCode);
    if (!room) return {};
    const player = room.getPlayer(meta.playerId);
    return { room, player };
  }

  /**
   * إرسال رسالة مباشرة عبر المقبس
   */
  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * إرسال رسالة خطأ موحدة
   */
  private sendError(ws: WebSocket, code: string, message: string): void {
    this.send(ws, {
      type: 'ERROR',
      payload: { code, message },
    });
  }
}
