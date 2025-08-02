import { Inject, Injectable } from '@nestjs/common';
import { UniversalLogger } from './logger';

@Injectable()
export class LoggerService {
  constructor(
    @Inject('BotLogger')
    private readonly logger: UniversalLogger,
  ) {}

  getLogger(context?: string) {
    if (context) {
      return this.logger.createChild(context);
    }
    return this.logger;
  }
}
