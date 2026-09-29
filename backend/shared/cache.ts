import Redis from 'ioredis';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
}

export const LEADERBOARD_CACHE_KEY = 'lorcana:leaderboard:v1';
export const LEADERBOARD_TTL_SECONDS = 60;

let redisClient: Redis | null = null;
let connectionAttempted = false;

export function getRedisClient(): Redis | null {
  const endpoint = process.env.CACHE_ENDPOINT;
  if (!endpoint || endpoint.trim() === '') {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    const parts = endpoint.trim().split(':');
    const host = parts[0];
    const port = parts[1] ? parseInt(parts[1], 10) : 6379;

    redisClient = new Redis({
      host,
      port,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Fail fast: do not hang if cache node is unreachable
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      // Graceful error logging: prevent uncaught exceptions
      console.warn('[Cache Error]', err.message);
    });

    if (!connectionAttempted) {
      connectionAttempted = true;
      redisClient.connect().catch((err) => {
        console.warn('[Cache Connect Warning]', err.message);
      });
    }

    return redisClient;
  } catch (err: any) {
    console.warn('[Cache Init Error]', err?.message);
    return null;
  }
}

export async function getCachedLeaderboard(client: Redis | null): Promise<LeaderboardEntry[] | null> {
  if (!client) return null;
  try {
    const raw = await client.get(LEADERBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err: any) {
    console.warn('[Cache Get Error]', err?.message);
    return null;
  }
}

export async function setCachedLeaderboard(
  client: Redis | null,
  leaderboard: LeaderboardEntry[],
  ttlSeconds = LEADERBOARD_TTL_SECONDS
): Promise<void> {
  if (!client) return;
  try {
    const serialized = JSON.stringify(leaderboard);
    await client.set(LEADERBOARD_CACHE_KEY, serialized, 'EX', ttlSeconds);

    // Also populate Redis/Valkey sorted set for score ranking inspection
    const pipeline = client.pipeline();
    pipeline.del('lorcana:leaderboard:zset');
    for (const entry of leaderboard) {
      pipeline.zadd('lorcana:leaderboard:zset', entry.wins, entry.userId);
    }
    pipeline.expire('lorcana:leaderboard:zset', ttlSeconds);
    await pipeline.exec();
  } catch (err: any) {
    console.warn('[Cache Set Error]', err?.message);
  }
}

// Reset singleton instance (useful for unit testing cache failure scenarios)
export function resetRedisClientForTest(): void {
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch {}
    redisClient = null;
  }
  connectionAttempted = false;
}
