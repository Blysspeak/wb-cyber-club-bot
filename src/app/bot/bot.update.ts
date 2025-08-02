import { Ctx, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UniversalLogger } from './utils/logger/logger';
import { LoggerService } from './utils/logger/logger.service';

@Update()
export class BotUpdate {
  private readonly logger: UniversalLogger;
  constructor(private readonly loggerService: LoggerService) {
    this.logger = this.loggerService.getLogger('BotUpdate');
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    this.logger.info(`Bot started in chat ${ctx.chat.id}`);
    await ctx.reply('Welcome');
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply('Send me a sticker');
  }
}
