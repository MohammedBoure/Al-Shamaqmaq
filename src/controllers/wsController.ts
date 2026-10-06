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
        try {
          const rawString = typeof data === 'string' ? data : data.toString('utf-8');
          const message: ClientMessage = JSON.parse(rawString);
          this.handleClientMessage(ws, message);
        } catch (err: any) {
          this.sendError(ws, 'INVALID_JSON', 'الرسالة المرسلة ليست بتنسيق JSON صالح');
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

      case 'SUBMIT_VOTE':
        this.handleSubmitVote(ws, meta, message.payload);
        break;

      case 'NEXT_ROUND':
        this.handleNextRound(ws, meta);
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
            // إعادة ربط المقبس باللاعب
            player.attachSocket(ws);
            this.socketMeta.set(ws, { roomCode, playerId: player.id, sessionToken });

            // إرسال حالة الغرفة الكاملة للاعب العائد
            this.send(ws, {
              type: 'ROOM_JOINED',
              payload: {
                sessionToken: player.sessionToken,
                player: player.toProfile(),
                room: room.getPublicState(),
                topics: topicService.getTopicSummaries(),
              },
            });

            // إرسال سياق المرحلة الحالية للاعب العائد
            this.syncPlayerOnReconnect(player, room);

            // إشعار باقي لاعبي الغرفة بعودة اللاعب
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

    // إرسال تأكيد الانضمام للعميل
    this.send(ws, {
      type: 'ROOM_JOINED',
      payload: {
        sessionToken: newSessionToken,
        player: player.toProfile(),
        room: room.getPublicState(),
        topics: topicService.getTopicSummaries(),
      },
    });

    // إشعار باقي اللاعبين في الغرفة باللاعب الجديد
    room.broadcastExcept(player.id, {
      type: 'PLAYER_JOINED',
      payload: { player: player.toProfile() },
    });
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

      // إذا كان قد أجاب مسبقاً
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
      const publicOptions = room.roundOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isSelfSubmission: opt.authorPlayerIds.includes(player.id),
      }));

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
          isLastRound: room.currentRound >= room.settings.totalRounds,
          timeRemaining: room.timeRemaining,
        },
      });
    }
  }

  /**
   * معالجة تحديث الملف الشخصي للاعب (الاسم / الأفاتار)
   */
  private handleUpdateProfile(ws: WebSocket, meta: SocketMetadata, payload: any): void {
    const { room, player } = this.getRoomAndPlayer(meta);
    if (!room || !player) {
      this.sendError(ws, 'NOT_IN_ROOM', 'أنت لست منضماً لأي غرفة');
      return;
    }

    const updated = room.updatePlayerProfile(player.id, payload?.nickname, payload?.avatar);
    if (updated) {
      room.broadcast({
        type: 'PLAYER_UPDATED',
        payload: { player: updated.toProfile() },
      });
    }
  }

  /**
   * معالجة تعديل إعدادات الغرفة (المواضيع المسموحة، عدد الجولات، الأوقات)
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
