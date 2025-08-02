import { Provider } from '@nestjs/common';
import { UniversalLogger } from './logger';
import { BotLogger, LogLevel } from './logger.types';

export const loggerProviders: Provider[] = [
  {
    provide: 'BotLogger',
    useFactory: (): BotLogger => {
      return new UniversalLogger({
        level: LogLevel.TRACE,
        logToFile: true,
        filePath: 'logs/bot.log',
      });
    },
  },
];
