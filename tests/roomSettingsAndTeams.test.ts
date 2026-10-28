import { describe, it, expect } from 'vitest';
import { Room } from '../src/models/Room';
import { Player } from '../src/models/Player';

describe('Room Settings & Team Mode (Task #3)', () => {
  it('updates round duration, total rounds, max players, and enforces capacity', () => {
    const host = new Player({
      id: 'h1',
      nickname: 'المضيف',
      avatar: '👑',
      sessionToken: 'tok-h',
      isHost: true,
    });

    const room = new Room('CONF', host);

    // 1. تحديث الإعدادات (وقت السؤال، عدد الجولات، الحد الأقصى للاعبين)
    const success = room.updateSettings({
      answerDuration: 45,
      totalRounds: 7,
      maxPlayers: 3,
    });

    expect(success).toBe(true);
    expect(room.settings.answerDuration).toBe(45);
    expect(room.settings.totalRounds).toBe(7);
    expect(room.settings.maxPlayers).toBe(3);

    const publicState = room.getPublicState();
    expect(publicState.roundDuration).toBe(45);
    expect(publicState.totalRounds).toBe(7);
    expect(publicState.maxPlayers).toBe(3);

    // 2. إضافة لاعب ثانٍ وثالث بنجاح
    const p2 = new Player({ id: 'p2', nickname: 'لاعب 2', avatar: '🐱', sessionToken: 'tok-2' });
    const p3 = new Player({ id: 'p3', nickname: 'لاعب 3', avatar: '🐶', sessionToken: 'tok-3' });
    expect(room.addPlayer(p2).success).toBe(true);
    expect(room.addPlayer(p3).success).toBe(true);
    expect(room.players.size).toBe(3);

    // 3. محاولة إضافة لاعب رابع تجاوزاً للحد الأقصى (3) -> يجب أن ترفض
    const p4 = new Player({ id: 'p4', nickname: 'لاعب 4', avatar: '🦊', sessionToken: 'tok-4' });
    const addResult = room.addPlayer(p4);
    expect(addResult.success).toBe(false);
    expect(addResult.error).toContain('ممتلئة');
  });

  it('manages Team Mode (Red vs Blue), auto-balances players, and computes team scores', () => {
    const host = new Player({
      id: 'h1',
      nickname: 'فارس',
      avatar: '👑',
      sessionToken: 'tok-h',
      isHost: true,
    });

    const room = new Room('TEAM', host);

    const p2 = new Player({ id: 'p2', nickname: 'سامي', avatar: '🐱', sessionToken: 'tok-2' });
    const p3 = new Player({ id: 'p3', nickname: 'ريما', avatar: '🦊', sessionToken: 'tok-3' });
    const p4 = new Player({ id: 'p4', nickname: 'نور', avatar: '🐼', sessionToken: 'tok-4' });

    room.addPlayer(p2);
    room.addPlayer(p3);
    room.addPlayer(p4);

    // تفعيل وضع الفرق
    room.updateSettings({ gameMode: 'teams' });
    expect(room.settings.gameMode).toBe('teams');

    // موازنة الفرق تلقائياً
    const players = room.getPlayerList();
    const redCount = players.filter((p) => p.teamId === 'red').length;
    const blueCount = players.filter((p) => p.teamId === 'blue').length;
    expect(redCount).toBe(2);
    expect(blueCount).toBe(2);

    // تغيير لاعب لفريق محدد يدوياً
    room.updatePlayerProfile('p2', undefined, undefined, 'blue');
    expect(p2.teamId).toBe('blue');

    // توزيع درجات وحساب لوحة صدارة الفرق
    host.score = 3; // أحمر
    p3.score = 2;   // أحمر
    p2.score = 4;   // أزرق
    p4.score = 1;   // أزرق

    const teamScores = room.getTeamLeaderboard();
    expect(teamScores.length).toBe(2);

    const redTeam = teamScores.find((t) => t.teamId === 'red');
    const blueTeam = teamScores.find((t) => t.teamId === 'blue');

    expect(redTeam?.score).toBe(5); // 3 + 2
    expect(blueTeam?.score).toBe(5); // 4 + 1
  });

  it('supports up to 40 players, 8 teams, custom team names, custom maxPlayers per team, and joinTeam', () => {
    const host = new Player({
      id: 'h1',
      nickname: 'المضيف',
      avatar: '👑',
      sessionToken: 'tok-h',
      isHost: true,
    });

    const room = new Room('MAX40', host);
    room.updateSettings({
      maxPlayers: 40,
      gameMode: 'teams',
      teamCount: 8,
    });

    expect(room.settings.maxPlayers).toBe(40);
    expect(room.settings.teamCount).toBe(8);
    expect(room.getActiveTeams().length).toBe(8);

    // إضافة 39 لاعباً إضافياً ليصبح المجموع 40 لاعباً
    for (let i = 2; i <= 40; i++) {
      const p = new Player({
        id: `p${i}`,
        nickname: `لاعب ${i}`,
        avatar: '🎮',
        sessionToken: `tok-${i}`,
      });
      expect(room.addPlayer(p).success).toBe(true);
    }
    expect(room.players.size).toBe(40);

    // تخصيص اسم الفريق وسعته القصوى
    room.updateSettings({
      teamIdToUpdate: { id: 'gold', name: 'نسور الصحراء', maxPlayers: 2 },
    });

    const goldTeam = room.getActiveTeams().find((t) => t.id === 'gold');
    expect(goldTeam?.name).toBe('نسور الصحراء');
    expect(goldTeam?.maxPlayers).toBe(2);

    // تفريغ فريق الذهب أولاً ثم اختبار الانضمام حتى يمتلئ
    for (const p of room.players.values()) {
      if (p.teamId === 'gold') p.teamId = 'red';
    }

    expect(room.joinTeam('p2', 'gold').success).toBe(true);
    expect(room.joinTeam('p3', 'gold').success).toBe(true);
    // اللاعب الثالث يجب أن يُرفض لأن السعة القصوى لفريق الذهب هي 2
    const overflowJoin = room.joinTeam('p4', 'gold');
    expect(overflowJoin.success).toBe(false);
    expect(overflowJoin.error).toContain('ممتلئ');
  });

  it('reveals correct answer to teammates when one writes it, lets teams vote on candidate answers, and displays 1 answer per team', () => {
    const host = new Player({
      id: 'p1',
      nickname: 'أحمد',
      avatar: '👑',
      sessionToken: 'tok-1',
      isHost: true,
    });
    const p2 = new Player({ id: 'p2', nickname: 'سارة', avatar: '🐱', sessionToken: 'tok-2' });
    const p3 = new Player({ id: 'p3', nickname: 'خالد', avatar: '🐶', sessionToken: 'tok-3' });
    const p4 = new Player({ id: 'p4', nickname: 'مريم', avatar: '🦊', sessionToken: 'tok-4' });

    const room = new Room('TVOTE', host);
    room.addPlayer(p2);
    room.addPlayer(p3);
    room.addPlayer(p4);

    room.updateSettings({ gameMode: 'teams', teamCount: 2 });
    room.joinTeam('p1', 'red');
    room.joinTeam('p2', 'red');
    room.joinTeam('p3', 'blue');
    room.joinTeam('p4', 'blue');

    // تجهيز جولة اختبارية
    room.phase = 'ANSWERING';
    room.currentRound = 1;
    room.currentPuzzle = {
      id: 'q1',
      prompt: 'ما هي عاصمة اليابان؟',
      correct_answers: ['طوكيو'],
      decoys: ['أوساكا', 'كيوتو', 'سيول'],
    };
    room.teamRoundStates.set('red', {
      teamId: 'red',
      teamName: 'صقور اللهب',
      teamColor: '#f43f5e',
      hasCorrectAnswer: false,
      correctAnswerText: null,
      correctFinderId: null,
      correctFinderNickname: null,
      candidates: [],
      selectedCandidateId: null,
      submittedPlayerIds: [],
    });
    room.teamRoundStates.set('blue', {
      teamId: 'blue',
      teamName: 'ذئاب الموج',
      teamColor: '#3b82f6',
      hasCorrectAnswer: false,
      correctAnswerText: null,
      correctFinderId: null,
      correctFinderNickname: null,
      candidates: [],
      selectedCandidateId: null,
      submittedPlayerIds: [],
    });

    // الفريق الأزرق: لم يكتب أحد الإجابة الصحيحة، كل عضو كتب إجابة مختلفة
    room.submitInitialAnswer('p3', 'ناغويا');
    room.submitInitialAnswer('p4', 'سابورو');

    const blueState = room.teamRoundStates.get('blue');
    expect(blueState?.hasCorrectAnswer).toBe(false);
    expect(blueState?.candidates.length).toBe(2);

    // أعضاء الفريق الأزرق يصوتون لإجابة p4 ("سابورو") لتمثيل الفريق
    const candP4 = blueState!.candidates.find((c) => c.authorId === 'p4')!;
    room.submitTeamVote('p3', candP4.id);
    room.submitTeamVote('p4', candP4.id);
    expect(room.teamRoundStates.get('blue')?.selectedCandidateId).toBe(candP4.id);

    // الفريق الأحمر: عضو (p1) كتب الإجابة الصحيحة ("طوكيو") -> تكشف فوراً لزميله (p2)!
    const ansRes = room.submitInitialAnswer('p1', 'طوكيو');
    expect(ansRes.isCorrect).toBe(true);

    const redState = room.teamRoundStates.get('red');
    expect(redState?.hasCorrectAnswer).toBe(true);
    expect(redState?.correctAnswerText).toBe('طوكيو');
    expect(redState?.correctFinderNickname).toBe('أحمد');

    // يكتب الفريق الأحمر خدعة لتضليل المنافسين
    room.submitBluff('p1', 'يوكوهاما');
    room.submitInitialAnswer('p2', 'كوبه');

    // بعد انتهاء جميع اللاعبين من الكتابة، تبدأ فترة تصويت الفريق لمدة 15 ثانية قبل الانتقال للتصويت العام
    expect(room.phase).toBe('ANSWERING');
    expect(room.isTeamVotingSubPhase).toBe(true);
    expect(room.timeRemaining).toBe(15);
    expect(room.teamRoundStates.get('red')?.isTeamVotingPhase).toBe(true);
    expect(room.teamRoundStates.get('blue')?.isTeamVotingPhase).toBe(true);

    // بعد انتهاء مهلة الـ 15 ثانية لتصويت الفريق، تنتقل الغرفة للتصويت العام بعرض إجابة واحدة لكل فريق + الإجابة الصحيحة
    room.startVotingPhase();
    expect(room.phase).toBe('VOTING');
    expect(room.roundOptions.length).toBeLessThanOrEqual(4);
    expect(room.roundOptions.some((o) => o.text === 'سابورو')).toBe(true);
    expect(room.roundOptions.some((o) => o.text === 'ناغويا')).toBe(false);
    room.clearTimer();
  });

  it('handles host kicking players, aborting game, rematching, and player leaving', () => {
    const host = new Player({
      id: 'h1',
      nickname: 'المضيف',
      avatar: '👑',
      sessionToken: 'tok-h',
      isHost: true,
    });

    const room = new Room('KICK', host);
    const p2 = new Player({ id: 'p2', nickname: 'لاعب 2', avatar: '🐱', sessionToken: 'tok-2' });
    const p3 = new Player({ id: 'p3', nickname: 'لاعب 3', avatar: '🐶', sessionToken: 'tok-3' });

    room.addPlayer(p2);
    room.addPlayer(p3);
    expect(room.players.size).toBe(3);

    // 1. فحص طرد اللاعب
    // غير المضيف لا يمكنه طرد أحد
    const nonHostKick = room.kickPlayer('p2', 'p3');
    expect(nonHostKick.success).toBe(false);

    // المضيف لا يمكنه طرد نفسه
    const hostKickSelf = room.kickPlayer('h1', 'h1');
    expect(hostKickSelf.success).toBe(false);

    // المضيف يطرد لاعب 3 بنجاح
    const hostKickP3 = room.kickPlayer('h1', 'p3');
    expect(hostKickP3.success).toBe(true);
    expect(room.players.has('p3')).toBe(false);
    expect(room.players.size).toBe(2);

    // 2. فحص إنهاء المباراة (Abort Game)
    room.phase = 'ANSWERING';
    room.currentRound = 2;
    host.score = 5;
    p2.score = 3;

    // غير المضيف لا يمكنه إنهاء المباراة
    const nonHostAbort = room.abortGame('p2');
    expect(nonHostAbort.success).toBe(false);

    // المضيف ينهي المباراة ويعيد الجميع للردهة
    const hostAbort = room.abortGame('h1');
    expect(hostAbort.success).toBe(true);
    expect(room.phase).toBe('LOBBY');
    expect(room.currentRound).toBe(0);

    // 3. فحص إعادة التحدي (Rematch) وتصفير النقاط
    host.score = 10;
    p2.score = 8;
    room.phase = 'GAME_OVER';

    const rematchRes = room.rematch('h1');
    expect(rematchRes.success).toBe(true);
    expect(room.phase).toBe('LOBBY');
    expect(host.score).toBe(0);
    expect(p2.score).toBe(0);

    // 4. فحص مغادرة اللاعب وترقية المضيف التالي
    const leaveRes = room.leavePlayer('h1');
    expect(leaveRes.success).toBe(true);
    expect(leaveRes.shouldDestroy).toBe(false);
    expect(room.hostId).toBe('p2');
    expect(p2.isHost).toBe(true);

    // مغادرة آخر لاعب وتدمير الغرفة
    const leaveLast = room.leavePlayer('p2');
    expect(leaveLast.success).toBe(true);
    expect(leaveLast.shouldDestroy).toBe(true);
  });

  it('detects and tracks player cheating attempts (tab switching, screenshots, copy/paste)', () => {
    const host = new Player({
      id: 'h1',
      nickname: 'المضيف',
      avatar: '👑',
      sessionToken: 'tok-h',
      isHost: true,
    });
    const p2 = new Player({ id: 'p2', nickname: 'مازن', avatar: '🐱', sessionToken: 'tok-2' });

    const room = new Room('CHET', host);
    room.addPlayer(p2);
    room.phase = 'ANSWERING';

    const cheat1 = room.reportCheat('p2', 'TAB_SWITCH');
    expect(cheat1.success).toBe(true);
    expect(cheat1.cheatCount).toBe(1);
    expect(p2.cheatCount).toBe(1);
    expect(p2.lastCheatType).toBe('TAB_SWITCH');

    // فحص فترة التهدئة (Cooldown) لمنع التكرار اللحظي
    const duplicate = room.reportCheat('p2', 'TAB_SWITCH');
    expect(duplicate.success).toBe(false);
    expect(p2.cheatCount).toBe(1);

    // بعد مرور مهلة التهدئة يتم احتساب محاولة تصوير الشاشة
    p2.lastCheatAt = Date.now() - 4000;
    const cheat2 = room.reportCheat('p2', 'SCREENSHOT');
    expect(cheat2.success).toBe(true);
    expect(p2.cheatCount).toBe(2);
    expect(p2.lastCheatType).toBe('SCREENSHOT');

    // عند انتهاء المباراة، يجب أن يعود عداد الغش إلى 0 تلقائياً
    room.currentRound = room.settings.totalRounds;
    room.advanceToNextRoundOrFinish();
    expect(room.phase).toBe('GAME_OVER');
    expect(p2.cheatCount).toBe(0);
    expect(p2.lastCheatType).toBeNull();
  });
});
