import { Module } from '@nestjs/common';
import { loggerProviders } from './logger.providers';
import { LoggerService } from './logger.service';

@Module({
  providers: [LoggerService, ...loggerProviders],
  exports: [LoggerService],
})
export class LoggerModule {}
