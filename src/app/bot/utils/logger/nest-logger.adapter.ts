import { LoggerService } from '@nestjs/common';
import { UniversalLogger } from './logger';

export class NestLoggerAdapter implements LoggerService {
  constructor(private logger: UniversalLogger) {}

  log(message: any, context?: string): void {
    this.logger.info(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, context, { trace });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string): void {
    this.logger.trace(message, context);
  }
}
