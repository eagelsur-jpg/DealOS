import { Redis } from 'ioredis';
export class InMemoryCacheStore {
    store = new Map();
    async get(key) {
        const item = this.store.get(key);
        if (!item) {
            return null;
        }
        if (item.expiresAt && item.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }
        return JSON.parse(item.value);
    }
    async set(key, value, ttlSeconds) {
        this.store.set(key, {
            value: JSON.stringify(value),
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
        });
    }
    async del(key) {
        this.store.delete(key);
    }
}
export class RedisCacheStore {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        const value = await this.redis.get(key);
        if (!value) {
            return null;
        }
        return JSON.parse(value);
    }
    async set(key, value, ttlSeconds) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds && ttlSeconds > 0) {
            await this.redis.set(key, serialized, 'EX', ttlSeconds);
            return;
        }
        await this.redis.set(key, serialized);
    }
    async del(key) {
        await this.redis.del(key);
    }
}
export const createRedisClient = (url) => new Redis(url);
//# sourceMappingURL=cache.js.map