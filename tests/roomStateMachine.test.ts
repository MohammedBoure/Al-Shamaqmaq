import { describe, it, expect } from 'vitest';
import { Room } from '../src/models/Room';
import { Player } from '../src/models/Player';

describe('Room State Machine & Deception Game Loop', () => {
  it('executes a complete game loop with deception, voting, and scoring', () => {
    // 1. إنشاء اللاعبين والغرفة
    const host = new Player({
      id: 'player-1',
      nickname: 'طارق',
      avatar: '👑',
      sessionToken: 'token-1',
      isHost: true,
    });

    const player2 = new Player({
      id: 'player-2',
      nickname: 'سارة',
      avatar: '🦊',
      sessionToken: 'token-2',
      isHost: false,
    });

    const room = new Room('TEST', host, ['الفيزياء']);
    room.addPlayer(player2);

    expect(room.phase).toBe('LOBBY');
    expect(room.players.size).toBe(2);

    // التحقق من تعديل الملف التعريفي للاعب وحفظه
    const updatedP2 = room.updatePlayerProfile('player-2', 'سارة الذكية', '⭐');
    expect(updatedP2?.nickname).toBe('سارة الذكية');
    expect(updatedP2?.avatar).toBe('⭐');

    // 2. بدء اللعبة
    const startResult = room.startGame();
    expect(startResult.success).toBe(true);
    expect(room.phase).toBe('TOPIC_SELECTION');
    expect(room.currentRound).toBe(1);
    expect(room.currentPickerId).toBe('player-1');

    // 3. اختيار الموضوع
    const selectTopicResult = room.selectTopic('الفيزياء', 'player-1');
    expect(selectTopicResult.success).toBe(true);
    expect(room.phase).toBe('ANSWERING');
    expect(room.currentPuzzle).not.toBeNull();

    const puzzle = room.currentPuzzle!;
    const correctAnswer = puzzle.correct_answers[0];

    // 4. مرحلة الإجابة والخداع
    // اللاعب 1 (طارق) يكتب الإجابة الصحيحة!
    const ans1Result = room.submitInitialAnswer('player-1', correctAnswer);
    expect(ans1Result.success).toBe(true);
    expect(ans1Result.isCorrect).toBe(true);
    expect(ans1Result.requiresBluff).toBe(true);
    expect(host.answerState.isCorrect).toBe(true);

    // محاولة كتابة الإجابة الصحيحة مجدداً كإجابة مزيفة -> يجب أن تُرفض!
    const invalidBluffResult = room.submitBluff('player-1', correctAnswer);
    expect(invalidBluffResult.success).toBe(false);
    expect(invalidBluffResult.error).toContain('عليك كتابة إجابة مزيفة');

    // اللاعب 1 يقدم إجابة مزيفة مقنعة
    const bluffText1 = 'المعدة والأمعاء الدقيقة';
    const validBluffResult = room.submitBluff('player-1', bluffText1);
    expect(validBluffResult.success).toBe(true);
    expect(host.answerState.bluffAnswer).toBe(bluffText1);

    // اللاعب 2 (سارة) يدخل إجابة خاطئة عادية -> تُعتمد تلقائياً كإجابته المزيفة المضللة (يُسمح بتطابق أو تشابه الإجابات الخاطئة بين عدة لاعبين)
    const bluffText2 = 'الرئتان اليمنى واليسرى';
    const ans2Result = room.submitInitialAnswer('player-2', bluffText2);
    expect(ans2Result.success).toBe(true);
    expect(ans2Result.isCorrect).toBe(false);
    expect(ans2Result.requiresBluff).toBe(false);
    expect(player2.answerState.bluffAnswer).toBe(bluffText2);

    // بعد إتمام كلا اللاعبين الإجابات، تنتقل الغرفة تلقائياً لمرحلة التصويت
    expect(room.phase).toBe('VOTING');
    expect(room.roundOptions.length).toBeGreaterThanOrEqual(2);

    // التحقق من أن الخيارات تحتوي على الإجابة الحقيقية والإجابات المزيفة
    const trueOption = room.roundOptions.find((o) => o.isCorrect);
    expect(trueOption).toBeDefined();

    const p1BluffOption = room.roundOptions.find((o) => o.authorPlayerIds.includes('player-1'));
    const p2BluffOption = room.roundOptions.find((o) => o.authorPlayerIds.includes('player-2'));

    expect(p1BluffOption).toBeDefined();
    expect(p2BluffOption).toBeDefined();

    // 5. مرحلة التصويت وقوانين الحظر
    // يحظر على اللاعب التصويت لإجابته المزيفة الخاصة به!
    const voteSelfP1 = room.submitVote('player-1', p1BluffOption!.id);
    expect(voteSelfP1.success).toBe(false);
    expect(voteSelfP1.error).toContain('كتبتها بنفسك');

    const voteSelfP2 = room.submitVote('player-2', p2BluffOption!.id);
    expect(voteSelfP2.success).toBe(false);
    expect(voteSelfP2.error).toContain('كتبتها بنفسك');

    // طارق (لاعب 1) انخدع وصوّت لإجابة سارة المزيفة!
    const voteP1 = room.submitVote('player-1', p2BluffOption!.id);
    expect(voteP1.success).toBe(true);

    // سارة (لاعب 2) صوّتت للإجابة الصحيحة الأصلية!
    const voteP2 = room.submitVote('player-2', trueOption!.id);
    expect(voteP2.success).toBe(true);

    // 6. التحقق من حساب النتائج بعد تصويت الجميع
    expect(room.phase).toBe('ROUND_RESULTS');
    expect(room.lastRoundResult).not.toBeNull();

    // سارة حصلت على:
    // +2 نقطة لأنها صوتت للإجابة الصحيحة.
    // +1 نقطة لأنها خدعت طارق وصوت لإجابتها المزيفة.
    // المجموع = 3 نقطة.
    expect(player2.score).toBe(3);

    // طارق حصل على:
    // 0 نقطة لأنه صوت لإجابة مزيفة، ولم يصوت أحد لإجابته المزيفة.
    expect(host.score).toBe(0);

    // التحقق من لوحة الصدارة
    const leaderboard = room.getLeaderboard();
    expect(leaderboard[0].id).toBe('player-2');
    expect(leaderboard[0].score).toBe(3);
    expect(leaderboard[1].id).toBe('player-1');
    expect(leaderboard[1].score).toBe(0);

    room.clearTimer();
  });

  it('allows multiple players to submit the same wrong answer and credits all authors with points', () => {
    const host = new Player({
      id: 'player-1',
      nickname: 'طارق',
      avatar: '🎩',
      isHost: true,
    });
    const p2 = new Player({
      id: 'player-2',
      nickname: 'سارة',
      avatar: '🦊',
      isHost: false,
    });
    const p3 = new Player({
      id: 'player-3',
      nickname: 'أحمد',
      avatar: '🦁',
      isHost: false,
    });

    const room = new Room('MULTI_DUPE', host, ['الفيزياء']);
    room.addPlayer(p2);
    room.addPlayer(p3);

    room.startGame();
    room.selectTopic('الفيزياء', 'player-1');

    expect(room.phase).toBe('ANSWERING');

    // طارق وسارة كلاهما يكتب نفس الإجابة الخاطئة تماماً!
    const sharedWrongAnswer = 'المعدة والأمعاء';
    const p1Ans = room.submitInitialAnswer('player-1', sharedWrongAnswer);
    expect(p1Ans.success).toBe(true);
    expect(p1Ans.isCorrect).toBe(false);

    const p2Ans = room.submitInitialAnswer('player-2', sharedWrongAnswer);
    expect(p2Ans.success).toBe(true);
    expect(p2Ans.isCorrect).toBe(false);

    // أحمد يكتب إجابة خاطئة مختلفة
    const p3Ans = room.submitInitialAnswer('player-3', 'الرئتان');
    expect(p3Ans.success).toBe(true);

    expect(room.phase).toBe('VOTING');

    // التحقق من أن الإجابة المشتركة تم دمجها في خيار واحد يحتوي على كلا اللاعبين كمؤلفين
    const sharedOption = room.roundOptions.find((opt) =>
      opt.authorPlayerIds.includes('player-1') && opt.authorPlayerIds.includes('player-2')
    );
    expect(sharedOption).toBeDefined();
    expect(sharedOption?.authorPlayerIds).toHaveLength(2);

    // كلاهما لا يستطيع التصويت لهذا الخيار المشترك
    const p1SelfVote = room.submitVote('player-1', sharedOption!.id);
    expect(p1SelfVote.success).toBe(false);

    const p2SelfVote = room.submitVote('player-2', sharedOption!.id);
    expect(p2SelfVote.success).toBe(false);

    // أحمد ينخدع ويصوت للخيار المشترك!
    const p3Vote = room.submitVote('player-3', sharedOption!.id);
    expect(p3Vote.success).toBe(true);

    // طارق وسارة يصوتان للخيار الصحيح
    const correctOpt = room.roundOptions.find((opt) => opt.isCorrect);
    room.submitVote('player-1', correctOpt!.id);
    room.submitVote('player-2', correctOpt!.id);

    expect(room.phase).toBe('ROUND_RESULTS');

    // كلاهما حصل على +2 (للإجابة الصحيحة) + 1 (لأن أحمد انخدع بإجابتهما المشتركة) = 3 نقاط
    expect(host.score).toBe(3);
    expect(p2.score).toBe(3);
    expect(p3.score).toBe(0);

    room.clearTimer();
  });

  it('supports adding and playing with a virtual test bot', () => {
    const host = new Player({
      id: 'player-solo',
      nickname: 'اللاعب المنفرد',
      avatar: '👑',
      sessionToken: 'token-solo',
      isHost: true,
    });

    const room = new Room('SOLO', host, ['الفيزياء']);
    expect(room.players.size).toBe(1);

    // محاولة بدء اللعبة بلاعب واحد فقط -> ترفض
    const startAlone = room.startGame();
    expect(startAlone.success).toBe(false);

    // إضافة روبوت تجريبي
    const botResult = room.addBot();
    expect(botResult.success).toBe(true);
    expect(botResult.bot).toBeDefined();
    expect(botResult.bot?.isBot).toBe(true);
    expect(room.players.size).toBe(2);

    // إزالة الروبوت
    const removeResult = room.removeBot();
    expect(removeResult.success).toBe(true);
    expect(room.players.size).toBe(1);

    // إعادة إضافة الروبوت وبدء اللعبة بنجاح
    const reAddBot = room.addBot();
    expect(reAddBot.success).toBe(true);
    expect(room.players.size).toBe(2);

    const startWithBot = room.startGame();
    expect(startWithBot.success).toBe(true);
    expect(room.phase).toBe('TOPIC_SELECTION');

    room.clearTimer();
  });
});
