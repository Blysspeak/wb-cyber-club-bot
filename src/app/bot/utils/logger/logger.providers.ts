import { Provider } from '@nestjs/common';
import { UniversalLogger } from './logger';
import { LogLevel } from './logger.types';

export const loggerProviders: Provider[] = [
  {
    provide: 'UniversalLogger',
    useFactory: () => {
      return new UniversalLogger({
        level: LogLevel.TRACE,
        logToFile: true,
        filePath: 'logs/bot.log',
      });
    },
  },
];
