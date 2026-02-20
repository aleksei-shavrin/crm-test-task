import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) throw new Error("Redis not connected");
  return client;
}

export async function connectRedis(): Promise<void> {
  if (client) return;
  client = new Redis(REDIS_URL);
  console.log("Redis connected:", REDIS_URL);
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
    console.log("Redis disconnected");
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  return getRedisClient().get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  await getRedisClient().setex(key, ttlSeconds, value);
}

export async function cacheDel(key: string): Promise<void> {
  await getRedisClient().del(key);
}

export const STATS_ALL_KEY = "stats:all";
const STATS_CACHE_PREFIX = "stats:";
const TOKEN_BLACKLIST_PREFIX = "blacklist:token:";

export async function addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
  if (ttlSeconds > 0) {
    await getRedisClient().setex(`${TOKEN_BLACKLIST_PREFIX}${token}`, ttlSeconds, "1");
  }
}

export async function isBlacklisted(token: string): Promise<boolean> {
  const result = await getRedisClient().exists(`${TOKEN_BLACKLIST_PREFIX}${token}`);
  return result === 1;
}

export async function invalidateStatsForAll(): Promise<void> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${STATS_CACHE_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
