import { WebSocket } from 'ws';
import { PlayerProfile, PlayerAnswerState, PlayerVote } from '../types/game';
import { ServerMessage } from '../types/messages';

export class Player {
  public readonly id: string;
  public nickname: string;
  public avatar: string;
  public sessionToken: string;
  public isHost: boolean;
  public isConnected: boolean;
  public score: number;
  public socket: WebSocket | null;
  public answerState: PlayerAnswerState;
  public currentVote: PlayerVote | null;
  public lastSeenAt: number;
  public teamId: string | null;

  constructor(params: {
    id: string;
    nickname: string;
    avatar: string;
    sessionToken: string;
    isHost?: boolean;
    socket?: WebSocket;
    teamId?: string | null;
  }) {
    this.id = params.id;
    this.nickname = params.nickname;
    this.avatar = params.avatar;
    this.sessionToken = params.sessionToken;
    this.isHost = params.isHost ?? false;
    this.isConnected = true;
    this.score = 0;
    this.socket = params.socket ?? null;
    this.lastSeenAt = Date.now();
    this.currentVote = null;
    this.teamId = params.teamId ?? null;

    this.answerState = {
      initialAnswer: '',
      isCorrect: false,
      bluffAnswer: null,
      hasSubmittedInitial: false,
      hasSubmittedBluff: false,
      submittedAt: 0,
    };
  }

  /**
   * إعادة تهيئة حالة اللاعب الخاصة بالجولة الحالية
   */
  public resetRoundState(): void {
    this.answerState = {
      initialAnswer: '',
      isCorrect: false,
      bluffAnswer: null,
      hasSubmittedInitial: false,
      hasSubmittedBluff: false,
      submittedAt: 0,
    };
    this.currentVote = null;
  }

  /**
   * إرجاع الملف التعريفي العام للاعب
   */
  public toProfile(): PlayerProfile {
    return {
      id: this.id,
      nickname: this.nickname,
      avatar: this.avatar,
      isHost: this.isHost,
      isConnected: this.isConnected,
      score: this.score,
      teamId: this.teamId,
    };
  }

  /**
   * إرسال رسالة WebSocket مباشرة للاعب
   */
  public send(message: ServerMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (err) {
        console.error(`Error sending message to player ${this.id}:`, err);
      }
    }
  }

  /**
   * ربط مقبس اتصال جديد (إعادة الاتصال)
   */
  public attachSocket(socket: WebSocket): void {
    this.socket = socket;
    this.isConnected = true;
    this.lastSeenAt = Date.now();
  }

  /**
   * فصل مقبس الاتصال
   */
  public detachSocket(): void {
    this.socket = null;
    this.isConnected = false;
    this.lastSeenAt = Date.now();
  }
}
