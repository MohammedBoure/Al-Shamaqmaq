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
});
