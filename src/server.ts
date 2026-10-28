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
  const possibleDistPaths = [
    path.resolve(__dirname, '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ];
  const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/ws') {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    // مسار الصفحة الرئيسية للترحيب والفحص السريع في حال عدم وجود ملفات الواجهة المبنية
    app.get('/', (req, res) => {
      if (req.accepts('html')) {
        res.send(`
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>خادم لعبة الألغاز والخداع الاجتماعي 🎮</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Cairo', sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
              .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 32px; max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
              h1 { font-size: 24px; margin-bottom: 12px; color: #38bdf8; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
              .btn { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 24px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 15px; transition: transform 0.15s, background 0.15s; }
              .btn:hover { background: #7dd3fc; transform: scale(1.02); }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; background: #334155; color: #cbd5e1; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>🎮 خادم اللعبة يعمل بنجاح!</h1>
              <p>أنت حالياً في وضع التطوير (Backend Server). لتشغيل واجهة اللعبة، يرجى فتح واجهة Vite أو بناء المشروع للإنتاج.</p>
              <a href="http://localhost:5173" class="btn">🚀 الانتقال إلى واجهة اللعبة (Port 5173)</a>
              <div class="badge">لبناء نسخة الإنتاج الموحدة: npm run build</div>
            </div>
          </body>
          </html>
        `);
        return;
      }
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
