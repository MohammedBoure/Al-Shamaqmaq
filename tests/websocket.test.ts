import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import WebSocket from 'ws';
import { createApplication } from '../src/server';

class TestWsClient {
  public ws: WebSocket;
  private queue: any[] = [];
  private waiters: Array<{ predicate: (m: any) => boolean; resolve: (m: any) => void; timer: NodeJS.Timeout }> = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString('utf-8'));
        const waiterIndex = this.waiters.findIndex((w) => w.predicate(msg));
        if (waiterIndex >= 0) {
          const [waiter] = this.waiters.splice(waiterIndex, 1);
          clearTimeout(waiter.timer);
          waiter.resolve(msg);
        } else {
          this.queue.push(msg);
        }
      } catch (e) {
        console.error('Failed to parse test ws message:', e);
      }
    });
  }

  public send(obj: any): void {
    this.ws.send(JSON.stringify(obj));
  }

  public waitFor(type: string, timeoutMs: number = 5000): Promise<any> {
    const existingIndex = this.queue.findIndex((m) => m.type === type);
    if (existingIndex >= 0) {
      const [msg] = this.queue.splice(existingIndex, 1);
      return Promise.resolve(msg);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for message type: ${type}`));
      }, timeoutMs);

      this.waiters.push({
        predicate: (m) => m.type === type,
        resolve,
        timer,
      });
    });
  }

  public close(): void {
    this.ws.close();
  }
}

function connectWs(url: string): Promise<TestWsClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on('open', () => resolve(new TestWsClient(ws)));
    ws.on('error', (err) => reject(err));
  });
}

describe('WebSocket Real-time Flow & Reconnection', () => {
  let appInstance: ReturnType<typeof createApplication>;
  let server: http.Server;
  let wsUrl: string;
  let baseUrl: string;

  beforeAll(async () => {
    appInstance = createApplication();
    server = await appInstance.start(0, '127.0.0.1');
    const address = server.address() as any;
    wsUrl = `ws://127.0.0.1:${address.port}/ws`;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await appInstance.stop();
  });

  it('supports joining, profile update, and session reconnection over WebSocket', async () => {
    // 1. إنشاء غرفة عبر REST API
    const roomRes = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostNickname: 'المضيف_1', hostAvatar: '👑' }),
    });
    const roomData = await roomRes.json();
    const roomCode = roomData.roomCode;
    const hostToken = roomData.sessionToken;

    // 2. المضيف يتصل بالـ WebSocket بواسطة sessionToken الخاص به
    const hostClient = await connectWs(wsUrl);
    hostClient.send({
      type: 'JOIN_ROOM',
      payload: { roomCode, sessionToken: hostToken },
    });
    const hostJoinMsg = await hostClient.waitFor('ROOM_JOINED');
    expect(hostJoinMsg.type).toBe('ROOM_JOINED');
    expect(hostJoinMsg.payload.player.nickname).toBe('المضيف_1');

    // 3. لاعب ثانٍ ينضم عبر WebSocket
    const player2Client = await connectWs(wsUrl);
    player2Client.send({
      type: 'JOIN_ROOM',
      payload: { roomCode, nickname: 'لاعب_2', avatar: '🚀' },
    });
    const p2JoinMsg = await player2Client.waitFor('ROOM_JOINED');
    expect(p2JoinMsg.type).toBe('ROOM_JOINED');
    const p2Token = p2JoinMsg.payload.sessionToken;
    expect(p2Token).toBeTruthy();

    // 4. اللاعب 2 يغير اسمه والأفاتار
    player2Client.send({
      type: 'UPDATE_PROFILE',
      payload: { nickname: 'لاعب_2_المعدل', avatar: '🐱' },
    });
    const updateMsg = await player2Client.waitFor('PLAYER_UPDATED');
    expect(updateMsg.payload.player.nickname).toBe('لاعب_2_المعدل');
    expect(updateMsg.payload.player.avatar).toBe('🐱');

    // 5. محاكاة انقطاع اتصال اللاعب 2 ثم إعادة اتصاله بنفس الـ sessionToken
    player2Client.close();

    const reconnectClient = await connectWs(wsUrl);
    reconnectClient.send({
      type: 'JOIN_ROOM',
      payload: { roomCode, sessionToken: p2Token },
    });
    const reconnectedMsg = await reconnectClient.waitFor('ROOM_JOINED');
    expect(reconnectedMsg.type).toBe('ROOM_JOINED');
    expect(reconnectedMsg.payload.player.nickname).toBe('لاعب_2_المعدل');
    expect(reconnectedMsg.payload.player.avatar).toBe('🐱');

    hostClient.close();
    reconnectClient.close();
  });

  it('plays a complete round over WebSockets with deception, voting, and scores', async () => {
    // 1. إنشاء الغرفة عبر API
    const roomRes = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostNickname: 'حسام',
        hostAvatar: '👑',
        allowedTopicIds: ['islamic_history'],
      }),
    });
    const roomData = await roomRes.json();
    const roomCode = roomData.roomCode;
    const hostToken = roomData.sessionToken;

    // 2. اتصال المضيف ولاعب آخر
    const hostClient = await connectWs(wsUrl);
    hostClient.send({ type: 'JOIN_ROOM', payload: { roomCode, sessionToken: hostToken } });
    await hostClient.waitFor('ROOM_JOINED');

    const p2Client = await connectWs(wsUrl);
    p2Client.send({ type: 'JOIN_ROOM', payload: { roomCode, nickname: 'نور', avatar: '🌸' } });
    await p2Client.waitFor('ROOM_JOINED');

    // 3. المضيف يبدأ اللعبة
    hostClient.send({ type: 'START_GAME' });
    const topicMsg = await hostClient.waitFor('TOPIC_SELECTION_STARTED');
    expect(topicMsg.type).toBe('TOPIC_SELECTION_STARTED');

    // 4. اختيار الموضوع
    hostClient.send({ type: 'SELECT_TOPIC', payload: { topicId: 'islamic_history' } });
    const roundStartedHost = await hostClient.waitFor('ROUND_STARTED');
    const roundStartedP2 = await p2Client.waitFor('ROUND_STARTED');
    expect(roundStartedHost.type).toBe('ROUND_STARTED');
    expect(roundStartedP2.type).toBe('ROUND_STARTED');

    // 5. إرسال الإجابات
    // نور (P2) ترسل إجابة خاطئة لتكون خدعتها
    p2Client.send({ type: 'SUBMIT_ANSWER', payload: { answer: 'إجابة مضللة رائعة' } });
    const p2Feedback = await p2Client.waitFor('ANSWER_FEEDBACK');
    expect(p2Feedback.payload.isCorrect).toBe(false);
    expect(p2Feedback.payload.requiresBluff).toBe(false);

    // حسام (المضيف) يرسل إجابة مزيفة عادية أيضاً
    hostClient.send({ type: 'SUBMIT_ANSWER', payload: { answer: 'تخمين آخر للتشتيت' } });
    const hostFeedback = await hostClient.waitFor('ANSWER_FEEDBACK');
    expect(hostFeedback.payload.isCorrect).toBe(false);

    // 6. كلاهما أجاب -> تنتقل اللعبة لمرحلة التصويت VOTING_STARTED
    const hostVoteStarted = await hostClient.waitFor('VOTING_STARTED');
    const p2VoteStarted = await p2Client.waitFor('VOTING_STARTED');
    expect(hostVoteStarted.type).toBe('VOTING_STARTED');
    expect(p2VoteStarted.type).toBe('VOTING_STARTED');
    expect(hostVoteStarted.payload.options.length).toBeGreaterThanOrEqual(2);

    // التحقق من أن خيار حسام موسوم بـ isSelfSubmission: true عنده
    const hostSelfOpt = hostVoteStarted.payload.options.find((o: any) => o.isSelfSubmission);
    expect(hostSelfOpt).toBeDefined();

    // والتحقق من أن خيار نور موسوم بـ isSelfSubmission: true عندها
    const p2SelfOpt = p2VoteStarted.payload.options.find((o: any) => o.isSelfSubmission);
    expect(p2SelfOpt).toBeDefined();

    // اختيار حسام للتصويت على خيار نور، ونور تصوت لخيار حسام
    hostClient.send({ type: 'SUBMIT_VOTE', payload: { optionId: p2SelfOpt.id } });
    p2Client.send({ type: 'SUBMIT_VOTE', payload: { optionId: hostSelfOpt.id } });

    // 7. استلام نتائج الجولة
    const hostResults = await hostClient.waitFor('ROUND_RESULTS_ANNOUNCED');
    const p2Results = await p2Client.waitFor('ROUND_RESULTS_ANNOUNCED');
    expect(hostResults.type).toBe('ROUND_RESULTS_ANNOUNCED');
    expect(p2Results.type).toBe('ROUND_RESULTS_ANNOUNCED');

    // كلاهما خدع الآخر، فكلاهما حصل على نقطة واحدة من الخداع!
    expect(hostResults.payload.leaderboard[0].score).toBe(1);
    expect(hostResults.payload.leaderboard[1].score).toBe(1);

    hostClient.close();
    p2Client.close();
  });
});
