export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  consumeRateLimit?(key: string, windowMs: number): Promise<number>;
}

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>;
  del(key: string): Promise<number>;
  eval(script: string, keys: number, ...args: Array<string | number>): Promise<unknown>;
}

export class InMemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return JSON.parse(item.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisLike) {}

  async consumeRateLimit(key: string, windowMs: number): Promise<number> {
    const script =
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end; return n";
    return Number(await this.redis.eval(script, 1, `dealos:rate:${key}`, windowMs));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
      return;
    }
    await this.redis.set(key, serialized);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

export const createRedisClient = async (url: string): Promise<RedisLike> => {
  const redisModule = await import('ioredis');
  const moduleObject = redisModule as unknown as {
    Redis?: new (url: string) => RedisLike;
    default?: new (url: string) => RedisLike;
  };
  const RedisConstructor = moduleObject.Redis ?? moduleObject.default;
  if (!RedisConstructor) {
    throw new Error('Unable to initialize Redis client');
  }

  return new RedisConstructor(url);
};
