// @ts-nocheck
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Cache helper functions
export class CacheService {
  private static readonly DEFAULT_TTL = 60 * 60; // 1 hour

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  static async flush(): Promise<boolean> {
    try {
      await redis.flushall();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  // Session management
  static async setSession(sessionId: string, data: unknown, ttl: number = 7 * 24 * 60 * 60): Promise<boolean> {
    return this.set(`session:${sessionId}`, data, ttl);
  }

  static async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  }

  static async delSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  static async rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const multi = redis.multi();
      const now = Date.now();
      const window = windowSeconds * 1000;
      const windowStart = now - window;

      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, now);
      multi.zcard(key);
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis transaction failed');
      }

      const count = results[2]?.[1] as number;
      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);

      return {
        allowed,
        remaining,
        resetTime: now + window,
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return { allowed: true, remaining: limit, resetTime: Date.now() };
    }
  }
}

// Health check function
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}
