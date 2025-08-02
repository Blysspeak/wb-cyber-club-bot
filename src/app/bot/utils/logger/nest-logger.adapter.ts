import {
  LoggerService as NestLoggerServiceInterface,
  LogLevel as NestLogLevel,
} from '@nestjs/common';
import { UniversalLogger } from './logger';

export class NestLoggerAdapter implements NestLoggerServiceInterface {
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
    this.logger.verbose(message, context);
  }

  fatal(message: any, context?: string): void {
    this.logger.fatal(message, context);
  }

  setLogLevels?(levels: NestLogLevel[]): void {}
}
