import { Request, Response, Router } from 'express';
import { topicService } from '../services/topicService';
import { roomManager } from '../services/roomManager';

export const apiRouter = Router();

/**
 * GET /api/health
 * فحص صحة وتشغيل السيرفر
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Deception Puzzle Game Backend',
  });
});

/**
 * GET /api/topics
 * استعراض قائمة المواضيع المتاحة
 */
apiRouter.get('/topics', (_req: Request, res: Response) => {
  try {
    const topics = topicService.getTopicSummaries();
    res.json({ success: true, topics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/topics/categories
 * استعراض الفئات والمواضيع المصنفة شجرياً
 */
apiRouter.get('/topics/categories', (_req: Request, res: Response) => {
  try {
    const categories = topicService.getCategoryGroups();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/rooms
 * إنشاء غرفة جديدة
 */
apiRouter.post('/rooms', (req: Request, res: Response) => {
  try {
    const {
      hostNickname,
      hostAvatar,
      allowedTopicIds,
      totalRounds,
      answerDuration,
      maxPlayers,
      gameMode,
    } = req.body || {};

    if (!hostNickname || typeof hostNickname !== 'string') {
      res.status(400).json({ success: false, error: 'اسم المضيف (hostNickname) مطلوب' });
      return;
    }

    if (allowedTopicIds && !topicService.validateTopicIds(allowedTopicIds)) {
      res.status(400).json({
        success: false,
        error: 'بعض أو كل معرفات المواضيع المختارة غير صالحة',
      });
      return;
    }

    const initialSettings = {
      ...(totalRounds ? { totalRounds: Number(totalRounds) } : {}),
      ...(answerDuration ? { answerDuration: Number(answerDuration) } : {}),
      ...(maxPlayers ? { maxPlayers: Number(maxPlayers) } : {}),
      ...(gameMode ? { gameMode } : {}),
    };

    const { room, host, sessionToken } = roomManager.createRoom(
      hostNickname,
      hostAvatar || '👑',
      allowedTopicIds,
      initialSettings
    );

    res.status(201).json({
      success: true,
      roomCode: room.code,
      sessionToken,
      player: host.toProfile(),
      room: room.getPublicState(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/rooms/:roomCode
 * فحص حالة غرفة معينة
 */
apiRouter.get('/rooms/:roomCode', (req: Request, res: Response) => {
  try {
    const { roomCode } = req.params;
    const room = roomManager.getRoom(roomCode);

    if (!room) {
      res.status(404).json({ success: false, error: 'الغرفة غير موجودة' });
      return;
    }

    res.json({
      success: true,
      room: room.getPublicState(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
