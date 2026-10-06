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

    const room = new Room('TEST', host, ['science_nature']);
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
    const selectTopicResult = room.selectTopic('science_nature', 'player-1');
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

    // محاولة إدخال إجابة مكررة من اللاعب 2 -> يجب أن تكتشف الخوارزمية التشابه وترفضها
    const duplicateSubmission = room.submitInitialAnswer('player-2', 'المعدة والامعاء الدقيقة');
    expect(duplicateSubmission.success).toBe(false);
    expect(duplicateSubmission.error).toContain('مشابهة');

    // اللاعب 2 (سارة) يدخل إجابة خاطئة عادية -> تُعتمد تلقائياً كإجابته المزيفة المضللة
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
    // +1 نقطة لأنها صوتت للإجابة الصحيحة.
    // +1 نقطة لأنها خدعت طارق وصوت لإجابتها المزيفة.
    // المجموع = 2 نقطة.
    expect(player2.score).toBe(2);

    // طارق حصل على:
    // 0 نقطة لأنه صوت لإجابة مزيفة، ولم يصوت أحد لإجابته المزيفة.
    expect(host.score).toBe(0);

    // التحقق من لوحة الصدارة
    const leaderboard = room.getLeaderboard();
    expect(leaderboard[0].id).toBe('player-2');
    expect(leaderboard[0].score).toBe(2);
    expect(leaderboard[1].id).toBe('player-1');
    expect(leaderboard[1].score).toBe(0);

    room.clearTimer();
  });
});
