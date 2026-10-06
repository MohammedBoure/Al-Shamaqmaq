import http from 'http';
import path from 'path';
import fs from 'fs';
import express, { Express } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { apiRouter } from './controllers/apiController';
import { WebSocketController } from './controllers/wsController';
import { config } from './config';

export function createApplication(): {
  app: Express;
  httpServer: http.Server;
  wss: WebSocketServer;
  wsController: WebSocketController;
  start: (port?: number, host?: string) => Promise<http.Server>;
  stop: () => Promise<void>;
} {
  const app: Express = express();

  // تفعيل الـ Middlewares
  app.use(cors());
  app.use(express.json());

  // توجيه واجهات الـ REST API
  app.use('/api', apiRouter);

  // خدمة ملفات الواجهة الأمامية إن كانت مبنية وموجودة
  const clientDistPath = path.resolve(__dirname, '../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/ws') {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    // مسار الصفحة الرئيسية للترحيب والفحص السريع في حال عدم وجود ملفات الواجهة
    app.get('/', (_req, res) => {
      res.json({
        message: 'خادم لعبة الألغاز والخداع الاجتماعي يعمل بنجاح 🎮',
        endpoints: {
          rest: '/api/topics, /api/rooms, /api/health',
          websocket: '/ws',
        },
      });
    });
  }

  // إنشاء خادم HTTP وخادم WebSocket المتزامن
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const wsController = new WebSocketController(wss);

  const start = (port: number = config.PORT, host: string = config.HOST): Promise<http.Server> => {
    return new Promise((resolve) => {
      httpServer.listen(port, host, () => {
        console.log(`🚀 خادم اللعبة يعمل على الرابط: http://${host}:${port}`);
        console.log(`🔌 منفذ الـ WebSocket متاح على: ws://${host}:${port}/ws`);
        resolve(httpServer);
      });
    });
  };

  const stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // إغلاق وإنهاء اتصالات جميع المقابس المفتوحة
      for (const client of wss.clients) {
        client.terminate();
      }
      wss.close(() => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  };

  return { app, httpServer, wss, wsController, start, stop };
}
