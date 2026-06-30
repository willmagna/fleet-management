import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [
          new KeyvRedis(
            `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
          ),
        ],
        ttl: Number(process.env.CACHE_TTL ?? '60') * 1000,
      }),
    }),
  ],
})
export class RedisModule {}
