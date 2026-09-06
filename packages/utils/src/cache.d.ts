import { Redis } from 'ioredis';
export interface CacheStore {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
export declare class InMemoryCacheStore implements CacheStore {
    private readonly store;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
export declare class RedisCacheStore implements CacheStore {
    private readonly redis;
    constructor(redis: Redis);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
}
export declare const createRedisClient: (url: string) => Redis;
//# sourceMappingURL=cache.d.ts.map