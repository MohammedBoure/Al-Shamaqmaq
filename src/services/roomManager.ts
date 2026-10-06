import { Room } from '../models/Room';
import { Player } from '../models/Player';
import { generateRoomCode, generateSessionToken, generateId } from '../utils/codeGenerator';
import { config } from '../config';

export interface PlayerSessionMapping {
  roomCode: string;
  playerId: string;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private sessions: Map<string, PlayerSessionMapping> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTask();
  }

  /**
   * إنشاء غرفة جديدة مع لاعب مضيف
   */
  public createRoom(
    hostNickname: string,
    hostAvatar: string,
    allowedTopicIds?: string[]
  ): { room: Room; host: Player; sessionToken: string } {
    let roomCode = generateRoomCode(4);
    let attempts = 0;

    // التأكد من عدم تكرار كود الغرفة
    while (this.rooms.has(roomCode) && attempts < 10) {
      roomCode = generateRoomCode(4);
      attempts++;
    }

    const hostId = generateId();
    const sessionToken = generateSessionToken();

    const hostPlayer = new Player({
      id: hostId,
      nickname: hostNickname.trim() || 'المضيف',
      avatar: hostAvatar.trim() || '👑',
      sessionToken,
      isHost: true,
    });

    const room = new Room(roomCode, hostPlayer, allowedTopicIds);
    this.rooms.set(roomCode, room);
    this.sessions.set(sessionToken, { roomCode, playerId: hostId });

    return { room, host: hostPlayer, sessionToken };
  }

  /**
   * جلب غرفة بواسطة الكود الخاص بها
   */
  public getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  /**
   * استرجاع بيانات الجلسة بواسطة الـ Session Token
   */
  public getSession(sessionToken: string): PlayerSessionMapping | undefined {
    return this.sessions.get(sessionToken);
  }

  /**
   * تسجيل جلسة جديدة للاعب
   */
  public registerSession(sessionToken: string, roomCode: string, playerId: string): void {
    this.sessions.set(sessionToken, { roomCode: roomCode.toUpperCase().trim(), playerId });
  }

  /**
   * انضمام لاعب جديد إلى غرفة قائمة
   */
  public joinRoom(
    roomCode: string,
    nickname: string,
    avatar: string
  ): { success: boolean; room?: Room; player?: Player; sessionToken?: string; error?: string } {
    const room = this.getRoom(roomCode);
    if (!room) {
      return { success: false, error: 'الغرفة المطلوبة غير موجودة' };
    }

    if (room.phase !== 'LOBBY') {
      return { success: false, error: 'لا يمكن الانضمام، اللعبة قد بدأت بالفعل' };
    }

    if (room.players.size >= config.MAX_PLAYERS_PER_ROOM) {
      return { success: false, error: 'الغرفة ممتلئة بالحد الأقصى للاعبين' };
    }

    const playerId = generateId();
    const sessionToken = generateSessionToken();

    const newPlayer = new Player({
      id: playerId,
      nickname: nickname.trim() || `لاعب_${room.players.size + 1}`,
      avatar: avatar.trim() || '🎭',
      sessionToken,
      isHost: false,
    });

    room.addPlayer(newPlayer);
    this.registerSession(sessionToken, room.code, playerId);

    return { success: true, room, player: newPlayer, sessionToken };
  }

  /**
   * حذف الغرفة وإلغاء جلساتها
   */
  public deleteRoom(roomCode: string): void {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);
    if (room) {
      // إزالة جلسات لاعبي الغرفة
      for (const player of room.players.values()) {
        this.sessions.delete(player.sessionToken);
      }
      room.destroy();
      this.rooms.delete(code);
    }
  }

  /**
   * فحص وتنظيف الغرف الخاملة دورياً
   */
  private startCleanupTask(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        const isIdle = now - room.lastActiveAt > config.ROOM_MAX_IDLE_TIME_MS;
        const allDisconnected = room.getConnectedPlayers().length === 0;

        if (isIdle || (allDisconnected && now - room.lastActiveAt > config.RECONNECT_GRACE_PERIOD_MS * 5)) {
          this.deleteRoom(code);
        }
      }
    }, config.ROOM_CLEANUP_INTERVAL_MS);
  }

  /**
   * تدمير المدير وإيقاف مهام التنظيف (لأغراض الاختبار وإغلاق السيرفر)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    for (const code of Array.from(this.rooms.keys())) {
      this.deleteRoom(code);
    }
  }
}

// تصدير نسخة عامة أحادية (Singleton)
export const roomManager = new RoomManager();
