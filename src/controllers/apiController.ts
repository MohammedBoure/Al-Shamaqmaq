import os from 'os';
import { Request, Response, Router } from 'express';
import { topicService } from '../services/topicService';
import { roomManager } from '../services/roomManager';

export const apiRouter = Router();

/**
 * استخراج عنوان الشبكة المحلية (LAN IPv4) لتمكين مشاركة الرابط عبر الأجهزة المختلفة (الهواتف والحواسيب)
 */
function getLocalNetworkIps(): { lanIp: string | null; allIps: string[] } {
  const nets = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(nets)) {
    const netList = nets[name];
    if (!netList) continue;
    // تجاهل الشبكات الافتراضية مثل WSL / Docker / VMware إن وجدت بدائل حقيقية
    const isVirtual = /vethernet|wsl|docker|vbox|vmware|hyper-v|loopback/i.test(name);
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        if (isVirtual) {
          candidates.push(net.address);
        } else {
          candidates.unshift(net.address);
        }
      }
    }
  }

  return {
    lanIp: candidates[0] || null,
    allIps: candidates,
  };
}

/**
 * GET /api/health
 * فحص صحة وتشغيل السيرفر
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  const { lanIp, allIps } = getLocalNetworkIps();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Deception Puzzle Game Backend',
    lanIp,
    allIps,
  });
});

/**
 * GET /api/network-info
 * جلب معلومات عنوان الشبكة المحلية لمشاركة الروابط ورموز QR بين الأجهزة والمنصات المختلفة
 */
apiRouter.get('/network-info', (_req: Request, res: Response) => {
  const { lanIp, allIps } = getLocalNetworkIps();
  res.json({
    success: true,
    lanIp,
    allIps,
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
      teamCount,
      teams,
    } = req.body || {};

    if (!hostNickname || typeof hostNickname !== 'string') {
      res.status(400).json({ success: false, error: 'اسم المضيف (hostNickname) مطلوب' });
      return;
    }

    const validTopicIds =
      Array.isArray(allowedTopicIds) && allowedTopicIds.length > 0
        ? allowedTopicIds
        : undefined;

    if (validTopicIds && !topicService.validateTopicIds(validTopicIds)) {
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
      ...(teamCount ? { teamCount: Number(teamCount) } : {}),
      ...(Array.isArray(teams) ? { teams } : {}),
    };

    const { room, host, sessionToken } = roomManager.createRoom(
      hostNickname,
      hostAvatar || '👑',
      validTopicIds,
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
