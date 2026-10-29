import { Player } from './Player';
import {
  GamePhase,
  RoomSettings,
  RoomPublicState,
  InternalVotingOption,
  PublicVotingOption,
  RoundResult,
  RoundResultOption,
  RoundScoreDetail,
  LeaderboardEntry,
  TeamScoreEntry,
  GameMode,
  TeamConfig,
  DEFAULT_TEAMS,
  TeamRoundState,
  CheatType,
} from '../types/game';
import { Puzzle } from '../types/topics';
import { ServerMessage } from '../types/messages';
import { topicService } from '../services/topicService';
import { checkAnswerMatch, areAnswersDuplicate, getDisplayCorrectAnswer } from '../utils/textNormalizer';
import { generateId, generateSessionToken } from '../utils/codeGenerator';
import { config } from '../config';

export class Room {
  public readonly code: string;
  public hostId: string;
  public players: Map<string, Player> = new Map();
  public phase: GamePhase = 'LOBBY';
  public settings: RoomSettings;

  public currentRound: number = 0;
  public pickerIndex: number = 0;
  public currentPickerId: string | null = null;
  public currentTopicId: string | null = null;
  public currentTopicTitle: string | null = null;
  public currentPuzzle: Puzzle | null = null;
  public usedPuzzleIds: Set<string> = new Set();

  public roundOptions: InternalVotingOption[] = [];
  public teamRoundStates: Map<string, TeamRoundState> = new Map();
  public isTeamVotingSubPhase: boolean = false;
  public lastRoundResult: RoundResult | null = null;

  public timeRemaining: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  public createdAt: number = Date.now();
  public lastActiveAt: number = Date.now();

  constructor(code: string, hostPlayer: Player, allowedTopicIds?: string[]) {
    this.code = code;
    this.hostId = hostPlayer.id;
    this.players.set(hostPlayer.id, hostPlayer);

    // التحقق من المواضيع المسموحة أو استخدام جميع المواضيع المتاحة كافتراضي
    const allTopicSummaries = topicService.getTopicSummaries();
    const validTopicIds =
      allowedTopicIds && allowedTopicIds.length > 0 && topicService.validateTopicIds(allowedTopicIds)
        ? allowedTopicIds
        : allTopicSummaries.map((t) => t.id);

    this.settings = {
      allowedTopicIds: validTopicIds,
      totalRounds: config.DEFAULT_TOTAL_ROUNDS,
      topicPickDuration: config.DEFAULT_TOPIC_PICK_TIME_SECONDS,
      answerDuration: config.DEFAULT_ANSWER_TIME_SECONDS,
      bluffDuration: config.DEFAULT_BLUFF_TIME_SECONDS,
      voteDuration: config.DEFAULT_VOTE_TIME_SECONDS,
      revealDuration: config.DEFAULT_REVEAL_TIME_SECONDS,
      maxPlayers: config.MAX_PLAYERS_PER_ROOM,
      gameMode: 'individual',
      teamCount: 2,
      teams: DEFAULT_TEAMS.map((t) => ({ ...t })),
    };
  }

  /**
   * جلب الفرق النشطة حالياً بحسب عدد الفرق المحدد (٢ إلى ٨ فرق)
   */
  public getActiveTeams(): TeamConfig[] {
    const count = Math.min(Math.max(2, this.settings.teamCount || 2), 8);
    return this.settings.teams.slice(0, count);
  }

  /**
   * إضافة لاعب جديد إلى الغرفة
   */
  public addPlayer(player: Player): { success: boolean; error?: string } {
    if (this.players.size >= this.settings.maxPlayers) {
      return {
        success: false,
        error: `الغرفة ممتلئة بالكامل (${this.settings.maxPlayers} لاعبين كحد أقصى)`,
      };
    }

    this.players.set(player.id, player);

    if (this.settings.gameMode === 'teams' && !player.teamId) {
      this.balanceTeams();
    }

    this.lastActiveAt = Date.now();
    return { success: true };
  }

  /**
   * إضافة لاعب تجريبي (روبوت) لمساعدة المستخدم في تجربة اللعبة بمفرده
   */
  public addBot(): { success: boolean; error?: string; bot?: Player } {
    if (this.phase !== 'LOBBY') {
      return { success: false, error: 'يمكن إضافة الروبوت في غرفة الانتظار فقط' };
    }
    if (this.players.size >= this.settings.maxPlayers) {
      return { success: false, error: 'الغرفة ممتلئة بالكامل' };
    }

    const botCount = Array.from(this.players.values()).filter((p) => p.isBot).length;
    const botNicknames = ['روبوت ذكي 🤖', 'عبقري الألغاز 🤖', 'ماكر الآركيد 🤖', 'مخادع سري 🤖'];
    const botName = botNicknames[botCount % botNicknames.length] || `روبوت ${botCount + 1} 🤖`;
    const botId = `bot-${generateId().slice(0, 8)}`;

    const botPlayer = new Player({
      id: botId,
      nickname: botName,
      avatar: '🤖',
      sessionToken: `token-${botId}`,
      isHost: false,
      isBot: true,
    });

    const addRes = this.addPlayer(botPlayer);
    if (!addRes.success) {
      return addRes;
    }

    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: { player: botPlayer.toProfile() },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true, bot: botPlayer };
  }

  /**
   * إزالة لاعب روبوت من الغرفة
   */
  public removeBot(botId?: string): { success: boolean; error?: string } {
    if (this.phase !== 'LOBBY') {
      return { success: false, error: 'يمكن إزالة الروبوت في غرفة الانتظار فقط' };
    }

    let targetBot: Player | undefined;
    if (botId) {
      targetBot = this.players.get(botId);
    } else {
      targetBot = Array.from(this.players.values()).find((p) => p.isBot);
    }

    if (!targetBot || !targetBot.isBot) {
      return { success: false, error: 'لم يتم العثور على روبوت لإزالته' };
    }

    this.removePlayer(targetBot.id, true);

    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { playerId: targetBot.id },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true };
  }

  /**
   * إزالة لاعب أو وسمه كمقطوع الاتصال
   */
  public removePlayer(playerId: string, forceDelete: boolean = false): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (forceDelete) {
      this.players.delete(playerId);
      if (this.hostId === playerId && this.players.size > 0) {
        const nextHost = this.players.values().next().value;
        if (nextHost) {
          nextHost.isHost = true;
          this.hostId = nextHost.id;
        }
      }
    } else {
      player.detachSocket();
    }

    this.lastActiveAt = Date.now();
  }

  /**
   * مغادرة لاعب للغرفة وتحديث البقية
   */
  public leavePlayer(playerId: string): { success: boolean; shouldDestroy: boolean; nextHostId?: string } {
    const player = this.players.get(playerId);
    if (!player) return { success: false, shouldDestroy: false };

    const wasHost = this.hostId === playerId;
    this.removePlayer(playerId, true);

    if (this.players.size === 0) {
      return { success: true, shouldDestroy: true };
    }

    let nextHostId: string | undefined;
    if (wasHost) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        nextHost.isHost = true;
        this.hostId = nextHost.id;
        nextHostId = nextHost.id;
      }
    }

    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { playerId },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true, shouldDestroy: false, nextHostId };
  }

  /**
   * طرد لاعب بواسطة المضيف
   */
  public kickPlayer(hostPlayerId: string, targetPlayerId: string): { success: boolean; error?: string } {
    if (this.hostId !== hostPlayerId) {
      return { success: false, error: 'المضيف فقط يملك صلاحية طرد اللاعبين' };
    }

    if (hostPlayerId === targetPlayerId) {
      return { success: false, error: 'لا يمكن للمضيف طرد نفسه' };
    }

    const target = this.players.get(targetPlayerId);
    if (!target) {
      return { success: false, error: 'اللاعب المراد طرده غير موجود في الغرفة' };
    }

    target.send({
      type: 'KICKED',
      payload: { reason: 'تم طردك من الجلسة بواسطة المضيف' },
    });

    this.removePlayer(targetPlayerId, true);

    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { playerId: targetPlayerId },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true };
  }

  /**
   * إنهاء المباراة الجارية والعودة لغرفة الانتظار بواسطة المضيف
   */
  public abortGame(hostPlayerId: string): { success: boolean; error?: string } {
    if (this.hostId !== hostPlayerId) {
      return { success: false, error: 'المضيف فقط يملك صلاحية إنهاء المباراة' };
    }

    this.clearTimer();
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.currentTopicId = null;
    this.currentTopicTitle = null;
    this.currentPuzzle = null;
    this.roundOptions = [];
    this.teamRoundStates.clear();
    this.isTeamVotingSubPhase = false;
    this.usedPuzzleIds.clear();

    for (const player of this.players.values()) {
      player.cheatCount = 0;
      player.lastCheatType = null;
      player.lastCheatAt = 0;
      player.resetRoundState();
    }

    this.broadcast({
      type: 'MATCH_ABORTED',
      payload: { reason: 'قام المضيف بإنهاء المباراة الحالية وإعادة الجميع إلى غرفة الانتظار' },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true };
  }

  /**
   * إعادة التحدي (Rematch) بعد انتهاء اللعبة
   */
  public rematch(hostPlayerId: string): { success: boolean; error?: string } {
    if (this.hostId !== hostPlayerId) {
      return { success: false, error: 'المضيف فقط يملك صلاحية بدء إعادة المباراة' };
    }

    this.clearTimer();
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.currentTopicId = null;
    this.currentTopicTitle = null;
    this.currentPuzzle = null;
    this.roundOptions = [];
    this.teamRoundStates.clear();
    this.isTeamVotingSubPhase = false;
    this.usedPuzzleIds.clear();

    // تصفير النقاط وحالات الجولة لجميع اللاعبين لبدء مباراة نظيفة
    for (const player of this.players.values()) {
      player.score = 0;
      player.cheatCount = 0;
      player.lastCheatType = null;
      player.lastCheatAt = 0;
      player.resetRoundState();
    }

    this.broadcast({
      type: 'REMATCH_STARTED',
      payload: { message: 'تم تصفير النقاط وبدء مباراة جديدة! استعدوا للانطلاق 🎭' },
    });

    this.broadcast({
      type: 'ROOM_UPDATED',
      payload: { room: this.getPublicState() },
    });

    return { success: true };
  }

  /**
   * جلب لاعب بواسطة معرفه
   */
  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * جلب قائمة اللاعبين كـ Array
   */
  public getPlayerList(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * جلب اللاعبين المتصلين حالياً
   */
  public getConnectedPlayers(): Player[] {
    return this.getPlayerList().filter((p) => p.isConnected);
  }

  /**
   * تحديث إعدادات الغرفة (من قبل المضيف فقط أثناء مرحلة الانتظار)
   */
  public updateSettings(
    newSettings: Partial<RoomSettings> & {
      teamIdToUpdate?: { id: string; name?: string; maxPlayers?: number };
    }
  ): boolean {
    if (this.phase !== 'LOBBY') return false;

    if (newSettings.allowedTopicIds !== undefined) {
      if (newSettings.allowedTopicIds.length === 0) {
        this.settings.allowedTopicIds = [];
      } else if (topicService.validateTopicIds(newSettings.allowedTopicIds)) {
        this.settings.allowedTopicIds = newSettings.allowedTopicIds;
      }
    }
    if (newSettings.totalRounds && newSettings.totalRounds > 0) {
      this.settings.totalRounds = Math.min(Math.max(1, newSettings.totalRounds), 20);
    }
    if (newSettings.maxPlayers && newSettings.maxPlayers >= 2) {
      this.settings.maxPlayers = Math.min(Math.max(2, newSettings.maxPlayers), 40);
    }
    if (newSettings.teamCount && newSettings.teamCount >= 2) {
      this.settings.teamCount = Math.min(Math.max(2, Math.floor(newSettings.teamCount)), 8);
    }
    if (Array.isArray(newSettings.teams) && newSettings.teams.length > 0) {
      for (const incoming of newSettings.teams) {
        const target = this.settings.teams.find((t) => t.id === incoming.id);
        if (target) {
          if (incoming.name && incoming.name.trim()) {
            target.name = incoming.name.trim().slice(0, 30);
          }
          if (typeof incoming.maxPlayers === 'number' && incoming.maxPlayers >= 1) {
            target.maxPlayers = Math.min(Math.max(1, Math.floor(incoming.maxPlayers)), 40);
          }
        }
      }
    }
    if (newSettings.teamIdToUpdate) {
      const { id, name, maxPlayers } = newSettings.teamIdToUpdate;
      const target = this.settings.teams.find((t) => t.id === id);
      if (target) {
        if (name !== undefined && name.trim()) {
          target.name = name.trim().slice(0, 30);
        }
        if (typeof maxPlayers === 'number' && maxPlayers >= 1) {
          target.maxPlayers = Math.min(Math.max(1, Math.floor(maxPlayers)), 40);
        }
      }
    }
    if (newSettings.gameMode && (newSettings.gameMode === 'individual' || newSettings.gameMode === 'teams')) {
      this.settings.gameMode = newSettings.gameMode;
    }

    if (this.settings.gameMode === 'teams') {
      this.balanceTeams();
    }

    if (newSettings.topicPickDuration && newSettings.topicPickDuration >= 5) {
      this.settings.topicPickDuration = newSettings.topicPickDuration;
    }
    if (newSettings.answerDuration && newSettings.answerDuration >= 10) {
      this.settings.answerDuration = newSettings.answerDuration;
    }
    if (newSettings.bluffDuration && newSettings.bluffDuration >= 10) {
      this.settings.bluffDuration = newSettings.bluffDuration;
    }
    if (newSettings.voteDuration && newSettings.voteDuration >= 10) {
      this.settings.voteDuration = newSettings.voteDuration;
    }
    if (newSettings.revealDuration && newSettings.revealDuration >= 5) {
      this.settings.revealDuration = newSettings.revealDuration;
    }

    this.lastActiveAt = Date.now();
    return true;
  }

  /**
   * موازنة الفرق تلقائياً في وضع الفرق مع مراعاة العدد الأقصى المخصص لكل فريق
   */
  public balanceTeams(): void {
    const activeTeams = this.getActiveTeams();
    if (activeTeams.length === 0) return;

    const activeIds = new Set(activeTeams.map((t) => t.id));
    const list = this.getPlayerList();

    // إعادة تعيين أي لاعب كان في فريق لم يعد ضمن الفرق النشطة
    for (const p of list) {
      if (p.teamId && !activeIds.has(p.teamId)) {
        p.teamId = null;
      }
    }

    // حساب عدد اللاعبين الحالي في كل فريق نشط
    const counts = new Map<string, number>();
    for (const t of activeTeams) {
      counts.set(t.id, 0);
    }
    for (const p of list) {
      if (p.teamId && counts.has(p.teamId)) {
        counts.set(p.teamId, (counts.get(p.teamId) || 0) + 1);
      }
    }

    // توزيع اللاعبين غير المنضمين لأي فريق على الفريق الأقل عدداً والذي لم يتجاوز سعته المخصصة
    for (const p of list) {
      if (!p.teamId) {
        // الفرق التي لم تصل إلى الحد الأقصى المخصص لها
        const availableTeams = activeTeams.filter(
          (t) => (counts.get(t.id) || 0) < t.maxPlayers
        );
        const pool = availableTeams.length > 0 ? availableTeams : activeTeams;

        let bestTeam = pool[0];
        let minCount = counts.get(bestTeam.id) || 0;
        for (const candidate of pool) {
          const c = counts.get(candidate.id) || 0;
          if (c < minCount) {
            minCount = c;
            bestTeam = candidate;
          }
        }

        p.teamId = bestTeam.id;
        counts.set(bestTeam.id, (counts.get(bestTeam.id) || 0) + 1);
      }
    }
  }

  /**
   * انضمام اللاعب أو انتقاله إلى فريق محدد مع التحقق من سعة الفريق المخصصة
   */
  public joinTeam(playerId: string, teamId: string): { success: boolean; player?: Player; error?: string } {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'اللاعب غير موجود في الغرفة' };
    }

    const activeTeams = this.getActiveTeams();
    const targetTeam = activeTeams.find((t) => t.id === teamId);
    if (!targetTeam) {
      return { success: false, error: 'الفريق المختار غير متاح حالياً' };
    }

    if (player.teamId === teamId) {
      return { success: true, player };
    }

    const currentMembers = this.getPlayerList().filter(
      (p) => p.teamId === teamId && p.id !== playerId
    );
    if (currentMembers.length >= targetTeam.maxPlayers) {
      return {
        success: false,
        error: `${targetTeam.name} ممتلئ (${targetTeam.maxPlayers} لاعبين كحد أقصى)`,
      };
    }

    player.teamId = teamId;
    this.lastActiveAt = Date.now();
    return { success: true, player };
  }

  /**
   * تحديث بيانات الملف الشخصي للاعب (الاسم أو الأفاتار أو الفريق)
   */
  public updatePlayerProfile(
    playerId: string,
    nickname?: string,
    avatar?: string,
    teamId?: string | null
  ): Player | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    if (nickname && nickname.trim()) {
      player.nickname = nickname.trim();
    }
    if (avatar && avatar.trim()) {
      player.avatar = avatar.trim();
    }
    if (teamId !== undefined) {
      if (teamId === null || teamId === '') {
        player.teamId = null;
      } else {
        const activeTeams = this.getActiveTeams();
        const targetTeam = activeTeams.find((t) => t.id === teamId);
        if (targetTeam) {
          const currentMembers = this.getPlayerList().filter(
            (p) => p.teamId === teamId && p.id !== playerId
          );
          if (currentMembers.length < targetTeam.maxPlayers) {
            player.teamId = teamId;
          }
        } else {
          // السماح بتعيين المعرف إذا كان ضمن قائمة الفرق الكاملة
          player.teamId = teamId;
        }
      }
    }

    this.lastActiveAt = Date.now();
    return player;
  }

  /**
   * بث رسالة إلى جميع اللاعبين المتصلين في الغرفة
   */
  public broadcast(message: ServerMessage): void {
    for (const player of this.players.values()) {
      player.send(message);
    }
  }

  /**
   * إرسال رسالة لجميع أعضاء فريق معين
   */
  public broadcastToTeam(teamId: string, message: ServerMessage): void {
    for (const player of this.players.values()) {
      if (player.teamId === teamId) {
        player.send(message);
      }
    }
  }

  /**
   * إرسال رسالة للاعبين باستثناء لاعب معين
   */
  public broadcastExcept(excludedPlayerId: string, message: ServerMessage): void {
    for (const player of this.players.values()) {
      if (player.id !== excludedPlayerId) {
        player.send(message);
      }
    }
  }

  /**
   * بدء اللعبة (من المضيف)
   */
  public startGame(): { success: boolean; error?: string } {
    if (this.phase !== 'LOBBY') {
      return { success: false, error: 'اللعبة قد بدأت بالفعل' };
    }

    const connectedPlayers = this.getConnectedPlayers();
    if (connectedPlayers.length < config.MIN_PLAYERS_TO_START) {
      return {
        success: false,
        error: `الحد الأدنى لبدء اللعبة هو ${config.MIN_PLAYERS_TO_START} لاعبين متصلين`,
      };
    }

    if (this.settings.gameMode === 'teams') {
      this.balanceTeams();
    }

    this.currentRound = 0;
    this.pickerIndex = 0;
    this.usedPuzzleIds.clear();

    for (const player of this.players.values()) {
      player.score = 0;
      player.cheatCount = 0;
      player.lastCheatType = null;
      player.lastCheatAt = 0;
      player.resetRoundState();
    }

    this.startTopicSelectionPhase();
    return { success: true };
  }

  /**
   * مرحلة 1: اختيار الموضوع (Topic Selection)
   */
  public startTopicSelectionPhase(): void {
    this.phase = 'TOPIC_SELECTION';
    this.currentRound += 1;
    this.lastActiveAt = Date.now();

    // تدوير دور اختيار الموضوع بين اللاعبين
    const playerList = this.getPlayerList();
    const currentPicker = playerList[this.pickerIndex % playerList.length];
    this.currentPickerId = currentPicker ? currentPicker.id : null;
    this.pickerIndex += 1;

    for (const player of this.players.values()) {
      player.resetRoundState();
    }

    this.currentTopicId = null;
    this.currentTopicTitle = null;
    this.currentPuzzle = null;
    this.roundOptions = [];
    this.teamRoundStates.clear();

    const filteredTopics = topicService
      .getTopicSummaries()
      .filter((t) => this.settings.allowedTopicIds.includes(t.id));

    const finalTopics = filteredTopics.length > 0 ? filteredTopics : topicService.getTopicSummaries();

    // اختيار ٦ مواضيع عشوائية كحد أقصى من بين المواضيع المحددة
    const shuffled = [...finalTopics].sort(() => 0.5 - Math.random());
    const allowedTopics = shuffled.slice(0, Math.min(6, shuffled.length));

    this.broadcast({
      type: 'TOPIC_SELECTION_STARTED',
      payload: {
        currentPickerId: this.currentPickerId,
        pickerNickname: currentPicker ? currentPicker.nickname : 'اللاعب',
        allowedTopics,
        timeRemaining: this.settings.topicPickDuration,
        players: this.getPlayerList().map((p) => p.toProfile()),
        teamScores: this.settings.gameMode === 'teams' ? this.getTeamLeaderboard() : undefined,
      },
    });

    // إذا كان المختار روبوتاً، يقوم باختيار موضوع عشوائي تلقائياً بعد ثانية ونصف
    if (currentPicker && currentPicker.isBot) {
      setTimeout(() => {
        if (this.phase === 'TOPIC_SELECTION' && this.currentPickerId === currentPicker.id) {
          const randomTopic = allowedTopics[Math.floor(Math.random() * allowedTopics.length)];
          if (randomTopic) {
            this.selectTopic(randomTopic.id);
          }
        }
      }, 1500);
    }

    this.startTimer(this.settings.topicPickDuration, () => {
      // إذا انتهى الوقت دون اختيار موضوع، يختار السيرفر موضوعاً عشوائياً
      const randomTopic = allowedTopics[Math.floor(Math.random() * allowedTopics.length)];
      if (randomTopic) {
        this.selectTopic(randomTopic.id);
      }
    });
  }

  /**
   * اختيار موضوع للجولة (من قبل اللاعب صاحب الدور)
   */
  public selectTopic(topicId: string, requestingPlayerId?: string): { success: boolean; error?: string } {
    if (this.phase !== 'TOPIC_SELECTION') {
      return { success: false, error: 'ليست مرحلة اختيار الموضوع حالياً' };
    }

    if (requestingPlayerId && this.currentPickerId && requestingPlayerId !== this.currentPickerId) {
      return { success: false, error: 'ليس دورك لاختيار موضوع هذه الجولة' };
    }

    if (!this.settings.allowedTopicIds.includes(topicId)) {
      return { success: false, error: 'هذا الموضوع غير مسموح به في إعدادات الغرفة' };
    }

    const topic = topicService.getTopicById(topicId);
    if (!topic) {
      return { success: false, error: 'الموضوع المطلوب غير موجود' };
    }

    const puzzle = topicService.getRandomPuzzle(topicId, this.usedPuzzleIds);
    if (!puzzle) {
      return { success: false, error: 'لا توجد ألغاز متوفرة في هذا الموضوع' };
    }

    this.usedPuzzleIds.add(puzzle.id);
    this.currentTopicId = topic.id;
    this.currentTopicTitle = topic.title;
    this.currentPuzzle = puzzle;

    this.startAnsweringPhase();
    return { success: true };
  }

  /**
   * تهيئة حالة الإجابات الخاصة بكل فريق في بداية الجولة
   */
  private initTeamRoundStates(): void {
    this.teamRoundStates.clear();
    this.isTeamVotingSubPhase = false;
    if (this.settings.gameMode !== 'teams') return;

    for (const team of this.getActiveTeams()) {
      this.teamRoundStates.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        hasCorrectAnswer: false,
        correctAnswerText: null,
        correctFinderId: null,
        correctFinderNickname: null,
        candidates: [],
        selectedCandidateId: null,
        submittedPlayerIds: [],
        isTeamVotingPhase: false,
      });
    }
  }

  /**
   * إضافة أو تحديث خيار إجابة داخل الفريق وإعادة حساب الخيار المتصدر لتصويت الفريق
   */
  private addOrUpdateTeamCandidate(teamId: string, player: Player, text: string): void {
    const teamState = this.teamRoundStates.get(teamId);
    if (!teamState) return;

    const clean = text.trim();
    if (!clean) return;

    const existing = teamState.candidates.find((c) => areAnswersDuplicate(c.text, clean));
    if (existing) {
      if (!existing.voterIds.includes(player.id)) {
        // إزالة صوت اللاعب من أي مرشح آخر أولاً
        for (const c of teamState.candidates) {
          c.voterIds = c.voterIds.filter((id) => id !== player.id);
        }
        existing.voterIds.push(player.id);
      }
    } else {
      // إزالة صوت اللاعب الافتراضي من أي مرشح سابق ووضعه على إجابته الجديدة
      for (const c of teamState.candidates) {
        c.voterIds = c.voterIds.filter((id) => id !== player.id);
      }
      const newCandidate = {
        id: generateId(),
        text: clean,
        authorId: player.id,
        authorNickname: player.nickname,
        authorAvatar: player.avatar,
        voterIds: [player.id],
      };
      teamState.candidates.push(newCandidate);
    }

    this.recomputeTeamSelectedCandidate(teamState);
    this.broadcastToTeam(teamId, {
      type: 'TEAM_ROUND_STATE_UPDATED',
      payload: { teamState },
    });
  }

  /**
   * حساب الإجابة المختارة لتمثيل الفريق بناءً على أصوات أعضاء الفريق
   */
  private recomputeTeamSelectedCandidate(teamState: TeamRoundState): void {
    if (teamState.candidates.length === 0) {
      teamState.selectedCandidateId = null;
      return;
    }
    let best = teamState.candidates[0];
    for (const c of teamState.candidates) {
      if (c.voterIds.length > best.voterIds.length) {
        best = c;
      }
    }
    teamState.selectedCandidateId = best.id;
  }

  /**
   * مرحلة 2: طرح اللغز واستقبال الإجابات (Answering Phase)
   */
  private startAnsweringPhase(): void {
    this.phase = 'ANSWERING';
    this.lastActiveAt = Date.now();

    if (!this.currentPuzzle || !this.currentTopicId) return;

    this.initTeamRoundStates();

    this.broadcast({
      type: 'ROUND_STARTED',
      payload: {
        roundNumber: this.currentRound,
        totalRounds: this.settings.totalRounds,
        topicId: this.currentTopicId,
        topicTitle: this.currentTopicTitle || '',
        puzzle: {
          id: this.currentPuzzle.id,
          prompt: this.currentPuzzle.prompt,
          image_url: this.currentPuzzle.image_url,
          answer_type: this.currentPuzzle.answer_type,
        },
        timeRemaining: this.settings.answerDuration,
      },
    });

    if (this.settings.gameMode === 'teams') {
      for (const [teamId, teamState] of this.teamRoundStates.entries()) {
        this.broadcastToTeam(teamId, {
          type: 'TEAM_ROUND_STATE_UPDATED',
          payload: { teamState },
        });
      }
    }

    // إرسال الإجابة تلقائياً لأي روبوت في الغرفة بعد مهلة واقعية
    const botPlayers = Array.from(this.players.values()).filter((p) => p.isBot);
    for (const bot of botPlayers) {
      setTimeout(() => {
        if (this.phase === 'ANSWERING' && this.currentPuzzle && !bot.answerState.hasSubmittedInitial) {
          const wrongAnswers = this.currentPuzzle.wrong_answers || [];
          const pick =
            wrongAnswers.length > 0
              ? wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]
              : 'تخمين بديل';
          this.submitInitialAnswer(bot.id, pick);
        }
      }, 1500 + Math.random() * 1500);
    }

    this.startTimer(this.settings.answerDuration, () => {
      this.handleAnsweringTimeout();
    });
  }

  /**
   * استلام الإجابة الأولية من اللاعب
   */
  public submitInitialAnswer(
    playerId: string,
    rawAnswer: string
  ): { success: boolean; error?: string; isCorrect?: boolean; requiresBluff?: boolean } {
    if (this.phase !== 'ANSWERING') {
      return { success: false, error: 'ليست مرحلة إرسال الإجابات حالياً' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'اللاعب غير موجود في الغرفة' };
    }

    if (player.answerState.hasSubmittedInitial) {
      return { success: false, error: 'لقد قمت بإرسال إجابتك بالفعل' };
    }

    const cleanAnswer = rawAnswer.trim();
    if (!cleanAnswer) {
      return { success: false, error: 'الإجابة لا يمكن أن تكون فارغة' };
    }

    if (!this.currentPuzzle) {
      return { success: false, error: 'لا يوجد لغز نشط حالياً' };
    }

    const isMatch = checkAnswerMatch(
      cleanAnswer,
      this.currentPuzzle.correct_answers,
      this.currentPuzzle.answer_type
    );

    if (isMatch) {
      // إجابة صحيحة! نبلغه سراً (ونبلغ فريقه في وضع الفرق) ونطلب صياغة إجابة مزيفة مقنعة
      player.answerState.initialAnswer = cleanAnswer;
      player.answerState.isCorrect = true;
      player.answerState.hasSubmittedInitial = true;
      player.answerState.submittedAt = Date.now();

      if (this.settings.gameMode === 'teams' && player.teamId) {
        const teamState = this.teamRoundStates.get(player.teamId);
        if (teamState) {
          teamState.hasCorrectAnswer = true;
          teamState.correctAnswerText = getDisplayCorrectAnswer(this.currentPuzzle.correct_answers);
          teamState.correctFinderId = player.id;
          teamState.correctFinderNickname = player.nickname;
          if (!teamState.submittedPlayerIds.includes(player.id)) {
            teamState.submittedPlayerIds.push(player.id);
          }
          this.broadcastToTeam(player.teamId, {
            type: 'TEAM_ROUND_STATE_UPDATED',
            payload: { teamState },
          });
        }
      }

      player.send({
        type: 'ANSWER_FEEDBACK',
        payload: {
          isCorrect: true,
          message:
            this.settings.gameMode === 'teams'
              ? 'أحسنت! إجابتك صحيحة 🎯 وتم كشفها لأعضاء فريقك! الآن اكتب خدعة لتضليل الفرق الأخرى.'
              : 'أحسنت! إجابتك صحيحة 🎯. الآن اكتب إجابة مزيفة مقنعة لتضليل وخداع باقي اللاعبين!',
          requiresBluff: true,
        },
      });

      player.send({
        type: 'BLUFF_REQUESTED',
        payload: {
          prompt: this.currentPuzzle.prompt,
          timeRemaining: this.timeRemaining,
          instruction: 'اكتب إجابة مزيفة تبدو حقيقية ليصوت عليها المنافسون',
        },
      });

      this.checkAndBroadcastAnswerProgress();
      return { success: true, isCorrect: true, requiresBluff: true };
    } else {
      // إجابة خاطئة: تُعتمد كإجابة مضللة مرشحة
      player.answerState.initialAnswer = cleanAnswer;
      player.answerState.bluffAnswer = cleanAnswer;
      player.answerState.isCorrect = false;
      player.answerState.hasSubmittedInitial = true;
      player.answerState.hasSubmittedBluff = true;
      player.answerState.submittedAt = Date.now();

      if (this.settings.gameMode === 'teams' && player.teamId) {
        const teamState = this.teamRoundStates.get(player.teamId);
        if (teamState && !teamState.submittedPlayerIds.includes(player.id)) {
          teamState.submittedPlayerIds.push(player.id);
        }
        this.addOrUpdateTeamCandidate(player.teamId, player, cleanAnswer);
      }

      player.send({
        type: 'ANSWER_FEEDBACK',
        payload: {
          isCorrect: false,
          message:
            this.settings.gameMode === 'teams'
              ? 'تم تسجيل إجابتك في قائمة فريقك! يمكنك الآن التصويت على أفضل إجابة لتمثيل فريقكم 🎭'
              : 'تم تسجيل إجابتك بنجاح! سيتم استخدامها كإجابة مضللة لتشتيت باقي اللاعبين 🎭',
          requiresBluff: false,
        },
      });

      this.checkAndBroadcastAnswerProgress();
      this.checkIfAllAnswersComplete();

      return { success: true, isCorrect: false, requiresBluff: false };
    }
  }

  /**
   * استلام الإجابة المزيفة (Bluff) من اللاعب الذي أجاب صحيحاً
   */
  public submitBluff(playerId: string, rawBluff: string): { success: boolean; error?: string } {
    if (this.phase !== 'ANSWERING') {
      return { success: false, error: 'ليست مرحلة تقديم الإجابات المزيفة' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'اللاعب غير موجود' };
    }

    if (!player.answerState.isCorrect) {
      return { success: false, error: 'لا يمكنك تقديم إجابة مزيفة إضافية، إجابتك الأولى اعتُمدت تلقائياً' };
    }

    if (player.answerState.hasSubmittedBluff) {
      return { success: false, error: 'لقد قدمت إجابتك المزيفة بالفعل' };
    }

    const cleanBluff = rawBluff.trim();
    if (!cleanBluff) {
      return { success: false, error: 'الإجابة المزيفة لا يمكن أن تكون فارغة' };
    }

    if (!this.currentPuzzle) {
      return { success: false, error: 'لا يوجد لغز نشط' };
    }

    // التحقق من أن الإجابة المزيفة ليست هي نفسها الإجابة الصحيحة!
    const isActuallyCorrect = checkAnswerMatch(
      cleanBluff,
      this.currentPuzzle.correct_answers,
      this.currentPuzzle.answer_type
    );
    if (isActuallyCorrect) {
      return {
        success: false,
        error: 'هذه هي الإجابة الصحيحة! عليك كتابة إجابة مزيفة وخاطئة لتضليل اللاعبين',
      };
    }

    player.answerState.bluffAnswer = cleanBluff;
    player.answerState.hasSubmittedBluff = true;

    if (this.settings.gameMode === 'teams' && player.teamId) {
      this.addOrUpdateTeamCandidate(player.teamId, player, cleanBluff);
    }

    player.send({
      type: 'ANSWER_FEEDBACK',
      payload: {
        isCorrect: true,
        message: 'تم حفظ إجابتك المزيفة بنجاح! في انتظار باقي اللاعبين...',
        requiresBluff: false,
      },
    });

    this.checkAndBroadcastAnswerProgress();
    this.checkIfAllAnswersComplete();

    return { success: true };
  }

  /**
   * تصويت أعضاء الفريق الواحد على الإجابة التي ستُعرض للفرق الأخرى (في حال لم يكتب أحد الإجابة الصحيحة أو لتحديد خدعة الفريق)
   */
  public submitTeamVote(playerId: string, candidateId: string): { success: boolean; error?: string } {
    if (this.phase !== 'ANSWERING') {
      return { success: false, error: 'ليست مرحلة اختيار إجابة الفريق حالياً' };
    }

    if (this.settings.gameMode !== 'teams') {
      return { success: false, error: 'تصويت الفريق متاح فقط في طور الفرق' };
    }

    const player = this.players.get(playerId);
    if (!player || !player.teamId) {
      return { success: false, error: 'اللاعب غير منضم لفريق' };
    }

    const teamState = this.teamRoundStates.get(player.teamId);
    if (!teamState) {
      return { success: false, error: 'حالة الفريق غير موجودة' };
    }

    const targetCandidate = teamState.candidates.find((c) => c.id === candidateId);
    if (!targetCandidate) {
      return { success: false, error: 'الإجابة المرشحة غير موجودة ضمن إجابات الفريق' };
    }

    for (const c of teamState.candidates) {
      c.voterIds = c.voterIds.filter((id) => id !== playerId);
    }
    targetCandidate.voterIds.push(playerId);

    this.recomputeTeamSelectedCandidate(teamState);

    this.broadcastToTeam(player.teamId, {
      type: 'TEAM_ROUND_STATE_UPDATED',
      payload: { teamState },
    });

    return { success: true };
  }

  /**
   * بث تقدم استقبال الإجابات للاعبين
   */
  private checkAndBroadcastAnswerProgress(): void {
    const connected = this.getConnectedPlayers();
    const readyPlayers = connected.filter(
      (p) => p.answerState.hasSubmittedInitial && (!p.answerState.isCorrect || p.answerState.hasSubmittedBluff)
    );

    this.broadcast({
      type: 'ANSWER_PROGRESS',
      payload: {
        submittedCount: readyPlayers.length,
        totalPlayers: connected.length,
        submittedPlayerIds: readyPlayers.map((p) => p.id),
      },
    });
  }

  /**
   * التحقق مما إذا كان جميع اللاعبين قد أتموا الإجابة والخداع
   */
  private checkIfAllAnswersComplete(): void {
    const connected = this.getConnectedPlayers();
    if (connected.length === 0) return;

    const allFinished = connected.every((p) => {
      if (!p.answerState.hasSubmittedInitial) return false;
      if (p.answerState.isCorrect && !p.answerState.hasSubmittedBluff) return false;
      return true;
    });

    if (allFinished) {
      this.clearTimer();
      if (this.settings.gameMode === 'teams' && !this.isTeamVotingSubPhase) {
        this.startTeamVotingSubPhase();
      } else {
        this.startVotingPhase();
      }
    }
  }

  /**
   * معالجة انتهاء وقت الإجابة
   */
  private handleAnsweringTimeout(): void {
    for (const player of this.getConnectedPlayers()) {
      if (!player.answerState.hasSubmittedInitial) {
        player.answerState.bluffAnswer = null;
        player.answerState.hasSubmittedInitial = true;
        player.answerState.hasSubmittedBluff = true;
      } else if (player.answerState.isCorrect && !player.answerState.hasSubmittedBluff) {
        player.answerState.bluffAnswer = null;
        player.answerState.hasSubmittedBluff = true;
      }
    }

    if (this.settings.gameMode === 'teams' && !this.isTeamVotingSubPhase) {
      this.startTeamVotingSubPhase();
    } else {
      this.startVotingPhase();
    }
  }

  /**
   * مرحلة فرعية لطور الفرق (15 ثانية): بعد أن يكتب جميع اللاعبين إجاباتهم،
   * يصوّت كل فريق لاختيار الإجابة التي ستمثله قبل الانتقال للتصويت العام
   */
  public startTeamVotingSubPhase(): void {
    this.clearTimer();
    this.isTeamVotingSubPhase = true;
    this.lastActiveAt = Date.now();
    const teamVoteSeconds = 15;
    this.timeRemaining = teamVoteSeconds;

    for (const [teamId, teamState] of this.teamRoundStates.entries()) {
      teamState.isTeamVotingPhase = true;
      this.recomputeTeamSelectedCandidate(teamState);
      this.broadcastToTeam(teamId, {
        type: 'TEAM_ROUND_STATE_UPDATED',
        payload: { teamState },
      });
    }

    this.broadcast({
      type: 'TIMER_TICK',
      payload: {
        phase: this.phase,
        timeRemaining: teamVoteSeconds,
      },
    });

    this.startTimer(teamVoteSeconds, () => {
      this.startVotingPhase();
    });
  }

  /**
   * مرحلة 3: عرض الخيارات والتصويت (Voting Phase)
   */
  public startVotingPhase(): void {
    this.clearTimer();
    this.isTeamVotingSubPhase = false;
    this.phase = 'VOTING';
    this.lastActiveAt = Date.now();

    if (!this.currentPuzzle) return;

    // 1. الإجابة الصحيحة الأصلية (مهيأة للعرض بدون "ال" التعريف)
    const trueAnswerText = getDisplayCorrectAnswer(this.currentPuzzle.correct_answers);
    const options: InternalVotingOption[] = [
      {
        id: generateId(),
        text: trueAnswerText,
        authorPlayerIds: [],
        isCorrect: true,
        teamId: null,
        teamName: null,
        teamColor: null,
      },
    ];

    if (this.settings.gameMode === 'teams') {
      // في طور الفرق: نعرض إجابة واحدة فقط لكل فريق (وليس ٤٠ إجابة منفصلة!)
      // بناءً على تصويت أعضاء الفريق أو الخدعة المختارة للفريق
      const activeTeams = this.getActiveTeams();
      for (const team of activeTeams) {
        const teamState = this.teamRoundStates.get(team.id);
        let chosenText: string | null = null;
        let chosenAuthorId: string | null = null;

        if (teamState && teamState.candidates.length > 0) {
          this.recomputeTeamSelectedCandidate(teamState);
          const selected =
            teamState.candidates.find((c) => c.id === teamState.selectedCandidateId) ||
            teamState.candidates[0];
          chosenText = selected.text;
          chosenAuthorId = selected.authorId;
        } else {
          // احتياط: البحث عن أي إجابة مزيفة من لاعبي هذا الفريق
          const teamPlayerWithBluff = this.getPlayerList().find(
            (p) => p.teamId === team.id && p.answerState.bluffAnswer && p.answerState.bluffAnswer.trim()
          );
          if (teamPlayerWithBluff && teamPlayerWithBluff.answerState.bluffAnswer) {
            chosenText = teamPlayerWithBluff.answerState.bluffAnswer.trim();
            chosenAuthorId = teamPlayerWithBluff.id;
          }
        }

        if (chosenText && chosenAuthorId) {
          const existingOption = options.find(
            (opt) => !opt.isCorrect && areAnswersDuplicate(opt.text, chosenText!)
          );
          if (existingOption) {
            if (!existingOption.authorPlayerIds.includes(chosenAuthorId)) {
              existingOption.authorPlayerIds.push(chosenAuthorId);
            }
          } else {
            options.push({
              id: generateId(),
              text: chosenText,
              authorPlayerIds: [chosenAuthorId],
              isCorrect: false,
              teamId: team.id,
              teamName: team.name,
              teamColor: team.color,
            });
          }
        }
      }

      // إضافة خيارات مضللة من بنك الأسئلة بحيث يكون العدد متناسباً مع عدد الفرق النشطة (بحد أقصى 9 خيارات)
      const teamsWithPlayers = activeTeams.filter((t) =>
        this.getPlayerList().some((p) => p.teamId === t.id)
      ).length;
      const targetTotalOptions = Math.max(3, Math.min(9, teamsWithPlayers + 1));
      this.fillDecoyOptions(options, targetTotalOptions);
    } else {
      // في الطور الفردي: الإجابات المزيفة للاعبين
      for (const player of this.players.values()) {
        const bluff = player.answerState.bluffAnswer;
        if (bluff && bluff.trim()) {
          const existingOption = options.find((opt) => !opt.isCorrect && areAnswersDuplicate(opt.text, bluff));
          if (existingOption) {
            if (!existingOption.authorPlayerIds.includes(player.id)) {
              existingOption.authorPlayerIds.push(player.id);
            }
          } else {
            options.push({
              id: generateId(),
              text: bluff.trim(),
              authorPlayerIds: [player.id],
              isCorrect: false,
            });
          }
        }
      }

      const targetTotalOptions = Math.max(2, Math.min(12, this.players.size + 1));
      this.fillDecoyOptions(options, targetTotalOptions);
    }

    // خلط الخيارات عشوائياً (Fisher-Yates Shuffle)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    this.roundOptions = options;

    // إرسال الخيارات لكل لاعب بشكل مخصص
    for (const player of this.players.values()) {
      const playerTeamState =
        this.settings.gameMode === 'teams' && player.teamId
          ? this.teamRoundStates.get(player.teamId)
          : undefined;

      const publicOptions: PublicVotingOption[] = options.map((opt) => {
        const isOwnTeamOption =
          this.settings.gameMode === 'teams' &&
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
          prompt: this.currentPuzzle.prompt,
          options: publicOptions,
          timeRemaining: this.settings.voteDuration,
        },
      });
    }

    // تسجيل أصوات الروبوتات تلقائياً
    const botPlayers = Array.from(this.players.values()).filter((p) => p.isBot);
    for (const bot of botPlayers) {
      setTimeout(() => {
        if (this.phase === 'VOTING' && !bot.currentVote) {
          const eligibleOptions = this.roundOptions.filter(
            (opt) =>
              !opt.authorPlayerIds.includes(bot.id) &&
              !(this.settings.gameMode === 'teams' && bot.teamId && opt.teamId === bot.teamId)
          );
          if (eligibleOptions.length > 0) {
            const randomPick = eligibleOptions[Math.floor(Math.random() * eligibleOptions.length)];
            this.submitVote(bot.id, randomPick.id);
          }
        }
      }, 1500 + Math.random() * 1500);
    }

    this.startTimer(this.settings.voteDuration, () => {
      this.calculateResultsAndReveal();
    });
  }

  /**
   * إكمال الخيارات بإجابات مضللة من بنك الأسئلة
   */
  private fillDecoyOptions(options: InternalVotingOption[], targetTotalOptions: number): void {
    if (!this.currentPuzzle) return;

    if (this.currentPuzzle.wrong_answers && Array.isArray(this.currentPuzzle.wrong_answers)) {
      for (const decoy of this.currentPuzzle.wrong_answers) {
        if (options.length >= targetTotalOptions) break;
        if (!decoy || !decoy.trim()) continue;
        const trimmedDecoy = decoy.trim();
        const isTrueMatch = checkAnswerMatch(
          trimmedDecoy,
          this.currentPuzzle.correct_answers,
          this.currentPuzzle.answer_type
        );
        const isExistingMatch = options.some((opt) => areAnswersDuplicate(opt.text, trimmedDecoy));
        if (!isTrueMatch && !isExistingMatch) {
          options.push({
            id: generateId(),
            text: trimmedDecoy,
            authorPlayerIds: [],
            isCorrect: false,
          });
        }
      }

      const topicObj = this.currentTopicId ? topicService.getTopicById(this.currentTopicId) : undefined;
      if (options.length < targetTotalOptions && topicObj?.puzzles) {
        for (const p of topicObj.puzzles) {
          if (options.length >= targetTotalOptions) break;
          for (const decoy of p.wrong_answers || []) {
            if (options.length >= targetTotalOptions) break;
            const trimmedDecoy = decoy?.trim();
            if (!trimmedDecoy) continue;
            const isTrueMatch = checkAnswerMatch(
              trimmedDecoy,
              this.currentPuzzle.correct_answers,
              this.currentPuzzle.answer_type
            );
            const isExistingMatch = options.some((opt) => areAnswersDuplicate(opt.text, trimmedDecoy));
            if (!isTrueMatch && !isExistingMatch) {
              options.push({
                id: generateId(),
                text: trimmedDecoy,
                authorPlayerIds: [],
                isCorrect: false,
              });
            }
          }
        }
      }
    }
  }

  /**
   * تسجيل صوت اللاعب (وفي وضع الفرق: مشاركة اختيارات أعضاء الفريق لحظياً ليتمكنوا من التوحد حول إجابة واحدة)
   */
  public submitVote(playerId: string, optionId: string): { success: boolean; error?: string } {
    if (this.phase !== 'VOTING') {
      return { success: false, error: 'ليست مرحلة التصويت حالياً' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'اللاعب غير موجود' };
    }

    if (player.currentVote && this.settings.gameMode !== 'teams') {
      return { success: false, error: 'لقد قمت بالتصويت بالفعل' };
    }

    const targetOption = this.roundOptions.find((opt) => opt.id === optionId);
    if (!targetOption) {
      return { success: false, error: 'الخيار المحدد غير موجود' };
    }

    // يُحظر على أي لاعب التصويت للإجابة التي كتبها هو بنفسه أو إجابة فريقه!
    const isOwnTeamOption =
      this.settings.gameMode === 'teams' &&
      Boolean(player.teamId && targetOption.teamId && player.teamId === targetOption.teamId);

    if (targetOption.authorPlayerIds.includes(playerId) || isOwnTeamOption) {
      return {
        success: false,
        error: isOwnTeamOption
          ? 'لا يمكنك التصويت لإجابة فريقك! اختر إجابة أخرى تعتقد أنها الحقيقية'
          : 'لا يمكنك التصويت للإجابة التي كتبتها بنفسك! اختر إجابة أخرى تعتقد أنها الحقيقية',
      };
    }

    player.currentVote = {
      playerId,
      optionId,
      votedAt: Date.now(),
    };

    if (this.settings.gameMode === 'teams' && player.teamId) {
      this.broadcastTeamVotes(player.teamId);
    }

    this.checkAndBroadcastVoteProgress();
    this.checkIfAllVotesComplete();

    return { success: true };
  }

  /**
   * إرسال اختيارات أعضاء الفريق لبعضهم البعض أثناء التصويت العام ليرى كل لاعب ماذا اختار فريقه
   */
  private broadcastTeamVotes(teamId: string): void {
    const teamVotes: Record<string, { id: string; nickname: string; avatar: string; teamId?: string | null }[]> = {};
    for (const p of this.players.values()) {
      if (p.teamId === teamId && p.currentVote) {
        const optId = p.currentVote.optionId;
        if (!teamVotes[optId]) {
          teamVotes[optId] = [];
        }
        teamVotes[optId].push({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          teamId: p.teamId,
        });
      }
    }

    this.broadcastToTeam(teamId, {
      type: 'TEAM_VOTES_UPDATED',
      payload: { teamVotes },
    });
  }

  /**
   * تسجيل وتنبيه محاولة غش من أحد اللاعبين (مغادرة المتصفح لسؤال الذكاء الاصطناعي، تصوير الشاشة، أو نسخ السؤال)
   */
  public reportCheat(playerId: string, cheatType: CheatType): { success: boolean; cheatCount?: number } {
    if (this.phase !== 'ANSWERING' && this.phase !== 'VOTING') {
      return { success: false };
    }

    const player = this.players.get(playerId);
    if (!player || player.isBot) {
      return { success: false };
    }

    // منع تكرار التنبيهات المتتالية لنفس الحدث خلال ٣ ثوانٍ
    const now = Date.now();
    if (now - player.lastCheatAt < 3000) {
      return { success: false };
    }

    player.lastCheatAt = now;
    player.cheatCount += 1;
    player.lastCheatType = cheatType;

    let reasonText = 'حاول الغش أثناء السؤال';
    if (cheatType === 'TAB_SWITCH') {
      reasonText = 'غادر المتصفح أثناء السؤال (ربما يسأل الذكاء الاصطناعي 🤖 أو يبحث عن الإجابة!)';
    } else if (cheatType === 'WINDOW_BLUR') {
      reasonText = 'خرج من نافذة اللعبة لفتح تطبيق خارجي أثناء السؤال!';
    } else if (cheatType === 'SCREENSHOT') {
      reasonText = 'حاول التلصص وتصوير الشاشة (Screenshot 📸) أثناء السؤال!';
    } else if (cheatType === 'COPY_PASTE') {
      reasonText = 'حاول نسخ السؤال أو لصق إجابة جاهزة من الخارج 📋!';
    }

    const message = `🚨 تنبيه كاشف الغش: ${player.nickname} ${reasonText} (المرة ${player.cheatCount})`;

    this.broadcast({
      type: 'CHEAT_DETECTED',
      payload: {
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        cheatType,
        cheatCount: player.cheatCount,
        message,
      },
    });

    this.broadcast({
      type: 'PLAYER_UPDATED',
      payload: { player: player.toProfile() },
    });

    return { success: true, cheatCount: player.cheatCount };
  }

  /**
   * بث تقدم التصويت للاعبين
   */
  private checkAndBroadcastVoteProgress(): void {
    const connected = this.getConnectedPlayers();
    const votedPlayers = connected.filter((p) => p.currentVote !== null);

    this.broadcast({
      type: 'VOTE_PROGRESS',
      payload: {
        submittedCount: votedPlayers.length,
        totalPlayers: connected.length,
        submittedPlayerIds: votedPlayers.map((p) => p.id),
      },
    });
  }

  /**
   * التحقق من اكتمال أصوات جميع اللاعبين
   */
  private checkIfAllVotesComplete(): void {
    const connected = this.getConnectedPlayers();
    if (connected.length === 0) return;

    const allVoted = connected.every((p) => p.currentVote !== null);
    if (allVoted) {
      this.clearTimer();
      this.calculateResultsAndReveal();
    }
  }

  /**
   * مرحلة 4: احتساب النقاط وإعلان نتائج الجولة (Scoring & Reveal)
   */
  private calculateResultsAndReveal(): void {
    this.phase = 'ROUND_RESULTS';
    this.lastActiveAt = Date.now();

    if (!this.currentPuzzle) return;

    // الخيار الصحيح
    const correctOption = this.roundOptions.find((opt) => opt.isCorrect);
    const correctOptionId = correctOption ? correctOption.id : null;

    // في طور الفرق: إذا كان أحد أعضاء الفريق قد توصل للإجابة الصحيحة أثناء مرحلة الكتابة،
    // وأحد زملائه لم يصوت قبل انتهاء الوقت، نحتسب تصويته للإجابة الصحيحة التي اكتشفها فريقه
    if (this.settings.gameMode === 'teams' && correctOptionId) {
      for (const player of this.players.values()) {
        if (!player.currentVote && player.teamId) {
          const teamState = this.teamRoundStates.get(player.teamId);
          if (teamState?.hasCorrectAnswer) {
            player.currentVote = {
              playerId: player.id,
              optionId: correctOptionId,
              votedAt: Date.now(),
            };
          }
        }
      }
    }

    // إعداد تفاصيل التصويت لكل خيار
    const resultOptions: RoundResultOption[] = this.roundOptions.map((opt) => {
      const authors = opt.authorPlayerIds
        .map((id) => this.players.get(id))
        .filter((p): p is Player => p !== undefined)
        .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar, teamId: p.teamId }));

      // من صوت لهذا الخيار؟
      const votes = Array.from(this.players.values())
        .filter((p) => p.currentVote?.optionId === opt.id)
        .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar, teamId: p.teamId }));

      return {
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        authors,
        votes,
        teamId: opt.teamId,
        teamName: opt.teamName,
        teamColor: opt.teamColor,
      };
    });

    // احتساب النقاط لكل لاعب
    const scoreBreakdown: RoundScoreDetail[] = [];

    for (const player of this.players.values()) {
      let correctPoints = 0;
      let votedForCorrect = false;

      // 1. فحص تصويت اللاعب للإجابة الصحيحة (+2 نقاط)
      if (player.currentVote && player.currentVote.optionId === correctOptionId) {
        correctPoints = 2;
        votedForCorrect = true;
      }

      // 2. فحص اللاعبين المخدوعين بإجابة هذا اللاعب أو فريقه (+1 نقطة عن كل مخدوع)
      const fooledPlayerNames: string[] = [];
      for (const otherPlayer of this.players.values()) {
        if (otherPlayer.id === player.id) continue;
        if (
          this.settings.gameMode === 'teams' &&
          player.teamId &&
          otherPlayer.teamId === player.teamId
        ) {
          continue;
        }
        if (otherPlayer.currentVote) {
          const chosenOption = this.roundOptions.find((opt) => opt.id === otherPlayer.currentVote?.optionId);
          if (chosenOption && chosenOption.authorPlayerIds.includes(player.id)) {
            fooledPlayerNames.push(otherPlayer.nickname);
          }
        }
      }

      const deceptionPoints = fooledPlayerNames.length * 1;
      const roundPoints = correctPoints + deceptionPoints;

      // تحديث نقاط اللاعب التراكمية
      player.score += roundPoints;

      scoreBreakdown.push({
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        votedForCorrect,
        correctPoints,
        fooledPlayerCount: fooledPlayerNames.length,
        fooledPlayerNames,
        deceptionPoints,
        roundPoints,
        totalScore: player.score,
        teamId: player.teamId,
        cheatCount: player.cheatCount,
      });
    }

    // إعداد الترتيب العام (Leaderboard)
    const leaderboard = this.getLeaderboard();
    const teamScores = this.settings.gameMode === 'teams' ? this.getTeamLeaderboard() : undefined;

    const roundResult: RoundResult = {
      roundNumber: this.currentRound,
      puzzleId: this.currentPuzzle.id,
      prompt: this.currentPuzzle.prompt,
      correctAnswer: getDisplayCorrectAnswer(this.currentPuzzle.correct_answers),
      options: resultOptions,
      scoreBreakdown,
      teamScores,
    };

    this.lastRoundResult = roundResult;
    const isLastRound = this.currentRound >= this.settings.totalRounds;

    this.broadcast({
      type: 'ROUND_RESULTS_ANNOUNCED',
      payload: {
        result: roundResult,
        leaderboard,
        teamScores,
        isLastRound,
        timeRemaining: this.settings.revealDuration,
      },
    });

    this.startTimer(this.settings.revealDuration, () => {
      this.advanceToNextRoundOrFinish();
    });
  }

  /**
   * الانتقال للجولة التالية أو إنهاء اللعبة
   */
  public advanceToNextRoundOrFinish(): void {
    this.clearTimer();

    if (this.currentRound >= this.settings.totalRounds) {
      this.finishGame();
    } else {
      this.startTopicSelectionPhase();
    }
  }

  /**
   * إنهاء اللعبة وإعلان الفائز (Game Over) وتصفير عداد الغش لجميع اللاعبين
   */
  private finishGame(): void {
    this.phase = 'GAME_OVER';
    this.lastActiveAt = Date.now();

    // تصفير عدد مرات الغش لكل لاعب عند انتهاء كل مباراة
    for (const player of this.players.values()) {
      player.cheatCount = 0;
      player.lastCheatType = null;
      player.lastCheatAt = 0;
    }

    const leaderboard = this.getLeaderboard();
    const teamScores = this.settings.gameMode === 'teams' ? this.getTeamLeaderboard() : undefined;
    const winner = leaderboard[0];

    this.broadcast({
      type: 'GAME_OVER_ANNOUNCED',
      payload: {
        leaderboard,
        winner,
        teamScores,
      },
    });
  }

  /**
   * جلب لوحة صدارة الفرق (حتى ٨ فرق بأسمائها وألوانها وسعتها المخصصة)
   */
  public getTeamLeaderboard(): TeamScoreEntry[] {
    const activeTeams = this.getActiveTeams();

    const teamScores = activeTeams.map((t) => {
      const teamPlayers = this.getPlayerList().filter((p) => p.teamId === t.id);
      const score = teamPlayers.reduce((sum, p) => sum + p.score, 0);
      return {
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        score,
        playerCount: teamPlayers.length,
        maxPlayers: t.maxPlayers,
        rank: 1,
      };
    });

    teamScores.sort((a, b) => b.score - a.score);
    teamScores.forEach((t, i) => (t.rank = i + 1));
    return teamScores;
  }

  /**
   * جلب لوحة الصدارة مرتبة من الأعلى للأدنى
   */
  public getLeaderboard(): LeaderboardEntry[] {
    const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    return sorted.map((p, index) => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      score: p.score,
      rank: index + 1,
      teamId: p.teamId,
      cheatCount: p.cheatCount,
    }));
  }

  /**
   * جلب الحالة العامة للغرفة
   */
  public getPublicState(): RoomPublicState {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      players: this.getPlayerList().map((p) => p.toProfile()),
      currentRound: this.currentRound,
      totalRounds: this.settings.totalRounds,
      currentPickerId: this.currentPickerId,
      allowedTopicIds: this.settings.allowedTopicIds,
      timeRemaining: this.timeRemaining,
      currentTopicTitle: this.currentTopicTitle,
      currentPrompt: this.currentPuzzle?.prompt ?? null,
      roundDuration: this.settings.answerDuration,
      maxPlayers: this.settings.maxPlayers,
      gameMode: this.settings.gameMode,
      teamCount: this.settings.teamCount,
      teams: this.getActiveTeams(),
      teamScores: this.settings.gameMode === 'teams' ? this.getTeamLeaderboard() : undefined,
    };
  }

  /**
   * إدارة المؤقت الزمني الداخلي وتحديث اللاعبين بالثواني المتبقية
   */
  private startTimer(durationSeconds: number, onComplete: () => void): void {
    this.clearTimer();
    this.timeRemaining = durationSeconds;

    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 1;

      this.broadcast({
        type: 'TIMER_TICK',
        payload: {
          phase: this.phase,
          timeRemaining: this.timeRemaining,
        },
      });

      if (this.timeRemaining <= 0) {
        this.clearTimer();
        onComplete();
      }
    }, 1000);
  }

  /**
   * إيقاف المؤقت
   */
  public clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * تدمير الغرفة وتحرير الموارد
   */
  public destroy(): void {
    this.clearTimer();
    this.players.clear();
  }
}
