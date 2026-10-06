import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createApplication } from '../src/server';

describe('REST API Endpoints', () => {
  let appInstance: ReturnType<typeof createApplication>;
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    appInstance = createApplication();
    server = await appInstance.start(0, '127.0.0.1');
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await appInstance.stop();
  });

  it('GET /api/health returns ok status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('Deception Puzzle Game Backend');
  });

  it('GET /api/topics returns available topic summaries', async () => {
    const res = await fetch(`${baseUrl}/api/topics`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body.topics.length).toBeGreaterThanOrEqual(4);
  });

  it('POST /api/rooms creates a room and returns session token', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostNickname: 'قائد اللعبة',
        hostAvatar: '🦁',
        allowedTopicIds: ['islamic_history', 'science_nature'],
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.roomCode).toBeTruthy();
    expect(body.sessionToken).toBeTruthy();
    expect(body.player.nickname).toBe('قائد اللعبة');
    expect(body.player.isHost).toBe(true);
    expect(body.room.code).toBe(body.roomCode);

    // التحقق من استرجاع حالة الغرفة عبر GET /api/rooms/:roomCode
    const getRes = await fetch(`${baseUrl}/api/rooms/${body.roomCode}`);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.room.code).toBe(body.roomCode);
  });

  it('returns 404 for non-existent room', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/NON_EXISTENT_CODE`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
