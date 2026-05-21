import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

const redisUrl = process.env.REDIS_URL;

export const redis =
  globalForRedis.redis ||
  (redisUrl
    ? new Redis(redisUrl, { 
        maxRetriesPerRequest: 1, 
        connectTimeout: 5000,
        commandTimeout: 5000 
      })
    : process.env.NODE_ENV === 'production'
    ? (null as unknown as Redis) // Do not fallback to localhost in production to avoid hanging Server Components
    : new Redis({ host: 'localhost', port: 6379, maxRetriesPerRequest: 1, connectTimeout: 2000 }));

if (process.env.NODE_ENV !== 'production' && redis) globalForRedis.redis = redis;
