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
} from '../types/game';
import { Puzzle, TopicSummary } from '../types/topics';
import { ServerMessage } from '../types/messages';
import { topicService } from '../services/topicService';
import { checkAnswerMatch, areAnswersDuplicate } from '../utils/textNormalizer';
import { generateId } from '../utils/codeGenerator';
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
    };
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

    if (this.settings.gameMode === 'teams' && !player.teamId) {
      const redCount = this.getPlayerList().filter((p) => p.teamId === 'red').length;
      const blueCount = this.getPlayerList().filter((p) => p.teamId === 'blue').length;
      player.teamId = redCount <= blueCount ? 'red' : 'blue';
    }

    this.players.set(player.id, player);
    this.lastActiveAt = Date.now();
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
  public updateSettings(newSettings: Partial<RoomSettings>): boolean {
    if (this.phase !== 'LOBBY') return false;

    if (newSettings.allowedTopicIds && topicService.validateTopicIds(newSettings.allowedTopicIds)) {
      this.settings.allowedTopicIds = newSettings.allowedTopicIds;
    }
    if (newSettings.totalRounds && newSettings.totalRounds > 0) {
      this.settings.totalRounds = Math.min(Math.max(1, newSettings.totalRounds), 20);
    }
    if (newSettings.maxPlayers && newSettings.maxPlayers >= 2) {
      this.settings.maxPlayers = Math.min(Math.max(2, newSettings.maxPlayers), 30);
    }
    if (newSettings.gameMode && (newSettings.gameMode === 'individual' || newSettings.gameMode === 'teams')) {
      this.settings.gameMode = newSettings.gameMode;
      if (this.settings.gameMode === 'teams') {
        this.balanceTeams();
      }
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
   * موازنة الفرق تلقائياً في وضع الفرق
   */
  public balanceTeams(): void {
    const list = this.getPlayerList();
    let redCount = 0;
    let blueCount = 0;
    for (const p of list) {
      if (p.teamId === 'red') redCount++;
      else if (p.teamId === 'blue') blueCount++;
    }
    for (const p of list) {
      if (!p.teamId) {
        if (redCount <= blueCount) {
          p.teamId = 'red';
          redCount++;
        } else {
          p.teamId = 'blue';
          blueCount++;
        }
      }
    }
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
      player.teamId = teamId || null;
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

    const allowedTopics = topicService
      .getTopicSummaries()
      .filter((t) => this.settings.allowedTopicIds.includes(t.id));

    this.broadcast({
      type: 'TOPIC_SELECTION_STARTED',
      payload: {
        currentPickerId: this.currentPickerId,
        pickerNickname: currentPicker ? currentPicker.nickname : 'اللاعب',
        allowedTopics,
        timeRemaining: this.settings.topicPickDuration,
      },
    });

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
   * مرحلة 2: طرح اللغز واستقبال الإجابات (Answering Phase)
   */
  private startAnsweringPhase(): void {
    this.phase = 'ANSWERING';
    this.lastActiveAt = Date.now();

    if (!this.currentPuzzle || !this.currentTopicId) return;

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
      // إجابة صحيحة! نبلغه سراً ونطلب منه صياغة إجابة مزيفة مقنعة
      player.answerState.initialAnswer = cleanAnswer;
      player.answerState.isCorrect = true;
      player.answerState.hasSubmittedInitial = true;
      player.answerState.submittedAt = Date.now();

      player.send({
        type: 'ANSWER_FEEDBACK',
        payload: {
          isCorrect: true,
          message: 'أحسنت! إجابتك صحيحة 🎯. الآن اكتب إجابة مزيفة مقنعة لتضليل وخداع باقي اللاعبين!',
          requiresBluff: true,
        },
      });

      player.send({
        type: 'BLUFF_REQUESTED',
        payload: {
          prompt: this.currentPuzzle.prompt,
          timeRemaining: this.timeRemaining,
          instruction: 'اكتب إجابة مزيفة تبدو حقيقية ليصوت عليها زملاؤك',
        },
      });

      this.checkAndBroadcastAnswerProgress();
      return { success: true, isCorrect: true, requiresBluff: true };
    } else {
      // إجابة خاطئة: تُعتمد تلقائياً كإجابته المزيفة المضللة في الجولة
      // التحقق من عدم التكرار مع إجابات مزيفة سابقة للاعبين آخرين
      const isDuplicate = this.isDuplicateWithExistingBluffs(cleanAnswer, playerId);
      if (isDuplicate) {
        return {
          success: false,
          error: 'تم تقديم إجابة مشابهة من لاعب آخر بالفعل، يرجى كتابة إجابة مختلفة أو صياغتها بطريقة أخرى',
        };
      }

      player.answerState.initialAnswer = cleanAnswer;
      player.answerState.bluffAnswer = cleanAnswer;
      player.answerState.isCorrect = false;
      player.answerState.hasSubmittedInitial = true;
      player.answerState.hasSubmittedBluff = true;
      player.answerState.submittedAt = Date.now();

      player.send({
        type: 'ANSWER_FEEDBACK',
        payload: {
          isCorrect: false,
          message: 'تم تسجيل إجابتك بنجاح! سيتم استخدامها كإجابة مضللة لتشتيت باقي اللاعبين 🎭',
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

    // التحقق من التكرار مع إجابات اللاعبين الآخرين
    if (this.isDuplicateWithExistingBluffs(cleanBluff, playerId)) {
      return {
        success: false,
        error: 'تم تقديم إجابة مزيفة مشابهة من قبل لاعب آخر، يرجى كتابة فكرة أخرى لتضليلهم',
      };
    }

    player.answerState.bluffAnswer = cleanBluff;
    player.answerState.hasSubmittedBluff = true;

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
   * فحص ما إذا كانت الإجابة تطابق إجابة مزيفة معتمدة لأي لاعب آخر
   */
  private isDuplicateWithExistingBluffs(answer: string, currentPlayerId: string): boolean {
    for (const [id, player] of this.players.entries()) {
      if (id === currentPlayerId) continue;
      if (player.answerState.bluffAnswer) {
        if (areAnswersDuplicate(answer, player.answerState.bluffAnswer)) {
          return true;
        }
      }
    }
    return false;
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
      this.startVotingPhase();
    }
  }

  /**
   * معالجة انتهاء وقت الإجابة
   */
  private handleAnsweringTimeout(): void {
    // لكل لاعب أجاب صحيحاً ولم يقدم خدعة، أو لاعب لم يجب نهائياً
    for (const player of this.getConnectedPlayers()) {
      if (!player.answerState.hasSubmittedInitial) {
        // لم يجب نهائياً: نضع له علامة تخطي
        player.answerState.bluffAnswer = null;
        player.answerState.hasSubmittedInitial = true;
        player.answerState.hasSubmittedBluff = true;
      } else if (player.answerState.isCorrect && !player.answerState.hasSubmittedBluff) {
        // أجاب صح ولم يكتب خدعة بالوقت المحدد
        player.answerState.bluffAnswer = null;
        player.answerState.hasSubmittedBluff = true;
      }
    }

    this.startVotingPhase();
  }

  /**
   * مرحلة 3: عرض الخيارات والتصويت (Voting Phase)
   */
  private startVotingPhase(): void {
    this.phase = 'VOTING';
    this.lastActiveAt = Date.now();

    if (!this.currentPuzzle) return;

    // تجميع الخيارات
    // 1. الإجابة الصحيحة الأصلية
    const trueAnswerText = this.currentPuzzle.correct_answers[0];
    const options: InternalVotingOption[] = [
      {
        id: generateId(),
        text: trueAnswerText,
        authorPlayerIds: [], // الإجابة الحقيقية ليس لها مؤلف من اللاعبين
        isCorrect: true,
      },
    ];

    // 2. الإجابات المزيفة للاعبين
    for (const player of this.players.values()) {
      const bluff = player.answerState.bluffAnswer;
      if (bluff && bluff.trim()) {
        // فحص إذا كان هناك خيار مطابق تقريباً موجود مسبقاً (دمج الإجابات المكررة إذا وجدت)
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

    // خلط الخيارات عشوائياً (Fisher-Yates Shuffle)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    this.roundOptions = options;

    // إرسال الخيارات لكل لاعب بشكل مخصص (مع وسم إجابته لمنعه من التصويت لها)
    for (const player of this.players.values()) {
      const publicOptions: PublicVotingOption[] = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isSelfSubmission: opt.authorPlayerIds.includes(player.id),
      }));

      player.send({
        type: 'VOTING_STARTED',
        payload: {
          prompt: this.currentPuzzle.prompt,
          options: publicOptions,
          timeRemaining: this.settings.voteDuration,
        },
      });
    }

    this.startTimer(this.settings.voteDuration, () => {
      this.calculateResultsAndReveal();
    });
  }

  /**
   * تسجيل صوت اللاعب
   */
  public submitVote(playerId: string, optionId: string): { success: boolean; error?: string } {
    if (this.phase !== 'VOTING') {
      return { success: false, error: 'ليست مرحلة التصويت حالياً' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'اللاعب غير موجود' };
    }

    if (player.currentVote) {
      return { success: false, error: 'لقد قمت بالتصويت بالفعل' };
    }

    const targetOption = this.roundOptions.find((opt) => opt.id === optionId);
    if (!targetOption) {
      return { success: false, error: 'الخيار المحدد غير موجود' };
    }

    // يُحظر على أي لاعب التصويت للإجابة التي كتبها هو بنفسه!
    if (targetOption.authorPlayerIds.includes(playerId)) {
      return {
        success: false,
        error: 'لا يمكنك التصويت للإجابة التي كتبتها بنفسك! اختر إجابة أخرى تعتقد أنها الحقيقية',
      };
    }

    player.currentVote = {
      playerId,
      optionId,
      votedAt: Date.now(),
    };

    this.checkAndBroadcastVoteProgress();
    this.checkIfAllVotesComplete();

    return { success: true };
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

    // إعداد تفاصيل التصويت لكل خيار
    const resultOptions: RoundResultOption[] = this.roundOptions.map((opt) => {
      const authors = opt.authorPlayerIds
        .map((id) => this.players.get(id))
        .filter((p): p is Player => p !== undefined)
        .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar }));

      // من صوت لهذا الخيار؟
      const votes = Array.from(this.players.values())
        .filter((p) => p.currentVote?.optionId === opt.id)
        .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar }));

      return {
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        authors,
        votes,
      };
    });

    // احتساب النقاط لكل لاعب
    // - نقطة واحدة إذا صوّت للإجابة الصحيحة الأصلية
    // - نقطة واحدة لصاحب الإجابة المزيفة عن كل لاعب خدعه وصوّت لإجابته
    const scoreBreakdown: RoundScoreDetail[] = [];

    for (const player of this.players.values()) {
      let correctPoints = 0;
      let votedForCorrect = false;

      // 1. فحص تصويت اللاعب للإجابة الصحيحة
      if (player.currentVote && player.currentVote.optionId === correctOptionId) {
        correctPoints = 1;
        votedForCorrect = true;
      }

      // 2. فحص اللاعبين المخدوعين بإجابة هذا اللاعب
      const fooledPlayerNames: string[] = [];
      for (const otherPlayer of this.players.values()) {
        if (otherPlayer.id === player.id) continue;
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
      });
    }

    // إعداد الترتيب العام (Leaderboard)
    const leaderboard = this.getLeaderboard();
    const teamScores = this.settings.gameMode === 'teams' ? this.getTeamLeaderboard() : undefined;

    const roundResult: RoundResult = {
      roundNumber: this.currentRound,
      puzzleId: this.currentPuzzle.id,
      prompt: this.currentPuzzle.prompt,
      correctAnswer: this.currentPuzzle.correct_answers[0],
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
   * إنهاء اللعبة وإعلان الفائز (Game Over)
   */
  private finishGame(): void {
    this.phase = 'GAME_OVER';
    this.lastActiveAt = Date.now();

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
   * جلب لوحة صدارة الفرق
   */
  public getTeamLeaderboard(): TeamScoreEntry[] {
    const teams = [
      { id: 'red', name: 'الفريق الأحمر', color: '#ef4444' },
      { id: 'blue', name: 'الفريق الأزرق', color: '#3b82f6' },
    ];

    const teamScores = teams.map((t) => {
      const teamPlayers = this.getPlayerList().filter((p) => p.teamId === t.id);
      const score = teamPlayers.reduce((sum, p) => sum + p.score, 0);
      return {
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        score,
        playerCount: teamPlayers.length,
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

      if (this.timeRemaining % 5 === 0 || this.timeRemaining <= 5) {
        this.broadcast({
          type: 'TIMER_TICK',
          payload: {
            phase: this.phase,
            timeRemaining: this.timeRemaining,
          },
        });
      }

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
