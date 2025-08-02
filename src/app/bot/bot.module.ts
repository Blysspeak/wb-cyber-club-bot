import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { Stage } from 'telegraf/scenes';
import { RedisModule } from '../database/redis/redis.module';
import { RedisService } from '../database/redis/redis.service';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { RegistrationModule } from './modules/registration/registration.module';
import { RegistrationScene } from './modules/registration/registration.scene';
import { LoggerModule } from './utils/logger/logger.module';

const stageProvider = {
  provide: Stage,
  useFactory: (registrationScene: RegistrationScene) => {
    const stage = new Stage<any>([registrationScene]);
    return stage;
  },
  inject: [RegistrationScene],
};

@Module({
  imports: [
    LoggerModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, RedisModule, RegistrationModule],
      useFactory: (
        configService: ConfigService,
        redisService: RedisService,
        stage: Stage<any>,
      ) => {
        const token = configService.get<string>('BOT_TOKEN');
        if (token === undefined) {
          throw new Error('BOT_TOKEN is not defined');
        }
        return {
          token,
          middlewares: [
            session({ store: redisService.createRedisStore() }),
            stage.middleware(),
          ],
        };
      },
      inject: [ConfigService, RedisService, Stage],
    }),
    RegistrationModule,
  ],
  providers: [BotService, BotUpdate, stageProvider],
})
export class BotModule {}
