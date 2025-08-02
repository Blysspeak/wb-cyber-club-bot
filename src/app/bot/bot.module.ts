import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { LoggerModule } from './utils/logger/logger.module';
import { RegistrationModule } from './modules/registration/registration.module';

@Module({
  imports: [
    LoggerModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('BOT_TOKEN');
        if (token === undefined) {
          throw new Error('BOT_TOKEN is not defined');
        }
        return {
          token,
        };
      },
      inject: [ConfigService],
    }),
    RegistrationModule,
  ],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
