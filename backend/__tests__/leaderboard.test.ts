import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedLeaderboard, setCachedLeaderboard, resetRedisClientForTest, LeaderboardEntry } from '../shared/cache';

describe('Leaderboard & Cache-Aside QA Suite (T05)', () => {
  beforeEach(() => {
    resetRedisClientForTest();
    vi.restoreAllMocks();
  });

  it('TC-LEAD-01: getCachedLeaderboard returns null when redis client is not provided or cache misses', async () => {
    const res = await getCachedLeaderboard(null);
    expect(res).toBeNull();

    const mockClient = {
      get: vi.fn().mockResolvedValue(null),
    } as any;
    const missRes = await getCachedLeaderboard(mockClient);
    expect(missRes).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith('lorcana:leaderboard:v1');
  });

  it('TC-LEAD-02: getCachedLeaderboard returns parsed entries on cache HIT', async () => {
    const mockEntries: LeaderboardEntry[] = [
      { rank: 1, userId: 'mickey_mouse', wins: 15, losses: 2, games: 17, winRate: 88 },
      { rank: 2, userId: 'elsa_queen', wins: 12, losses: 4, games: 16, winRate: 75 },
    ];
    const mockClient = {
      get: vi.fn().mockResolvedValue(JSON.stringify(mockEntries)),
    } as any;

    const hitRes = await getCachedLeaderboard(mockClient);
    expect(hitRes).toEqual(mockEntries);
  });

  it('TC-LEAD-03: setCachedLeaderboard stores data in Redis with EX 60 and updates sorted set', async () => {
    const mockEntries: LeaderboardEntry[] = [
      { rank: 1, userId: 'player_alpha', wins: 5, losses: 1, games: 6, winRate: 83 },
    ];
    const pipelineMock = {
      del: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };
    const mockClient = {
      set: vi.fn().mockResolvedValue('OK'),
      pipeline: vi.fn().mockReturnValue(pipelineMock),
    } as any;

    await setCachedLeaderboard(mockClient, mockEntries, 60);
    expect(mockClient.set).toHaveBeenCalledWith('lorcana:leaderboard:v1', JSON.stringify(mockEntries), 'EX', 60);
    expect(pipelineMock.del).toHaveBeenCalledWith('lorcana:leaderboard:zset');
    expect(pipelineMock.zadd).toHaveBeenCalledWith('lorcana:leaderboard:zset', 5, 'player_alpha');
    expect(pipelineMock.expire).toHaveBeenCalledWith('lorcana:leaderboard:zset', 60);
    expect(pipelineMock.exec).toHaveBeenCalled();
  });

  it('TC-LEAD-04: cache errors are handled gracefully without throwing unhandled exceptions', async () => {
    const errorClient = {
      get: vi.fn().mockRejectedValue(new Error('Connection refused to redis')),
      set: vi.fn().mockRejectedValue(new Error('Connection timed out')),
    } as any;

    const res = await getCachedLeaderboard(errorClient);
    expect(res).toBeNull();

    // setCachedLeaderboard should not throw
    await expect(setCachedLeaderboard(errorClient, [])).resolves.not.toThrow();
  });

  it('TC-LEAD-05: GET /api/leaderboard returns 200 and X-Cache header via HTTP', async () => {
    // Dynamically test endpoint with mocked docClient or when DynamoDB has 0 items
    // This verifies HTTP response structure and headers
    const { spawn } = await import('child_process');
    const path = await import('path');
    const os = await import('os');

    const port = String(39500 + Math.floor(Math.random() * 400));
    const backendDir = path.resolve(__dirname, '..');
    const serverProcess = spawn(
      process.execPath,
      [path.join(backendDir, 'node_modules/tsx/dist/cli.mjs'), path.join(backendDir, 'server.ts')],
      {
        cwd: os.tmpdir(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: port,
          JWT_SECRET: 'x'.repeat(48),
          ADMIN_PASSCODE: 'real-passcode-123',
          CACHE_ENDPOINT: '', // disabled cache
        },
        stdio: 'ignore',
      }
    );

    const baseUrl = `http://127.0.0.1:${port}`;
    try {
      for (let i = 0; i < 40; i++) {
        if (await fetch(`${baseUrl}/health`).then((r) => r.ok, () => false)) break;
        await new Promise((r) => setTimeout(r, 250));
      }

      const res = await fetch(`${baseUrl}/api/leaderboard`);
      expect(res.status).toBe(200);
      expect(res.headers.get('x-cache')).toBe('MISS');
      const body = await res.json();
      expect(Array.isArray(body.leaderboard)).toBe(true);
      expect(typeof body.durationMs).toBe('number');
    } finally {
      serverProcess.kill();
    }
  }, 20000);
});
