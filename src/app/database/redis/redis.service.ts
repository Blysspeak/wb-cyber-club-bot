import { Inject, Injectable } from '@nestjs/common';
import { Redis } from '@telegraf/session/redis';
import { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClient,
  ) {}

  getClient(): RedisClient {
    return this.redisClient;
  }

  createRedisStore() {
    return Redis({
      client: this.redisClient as any,
    });
  }
}
