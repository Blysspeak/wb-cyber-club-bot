import { Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { BaseScene, SceneContext } from 'telegraf/scenes';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UniversalLogger } from '#logger';
import { LoggerService } from '#logger';

@Scene('registration')
export class RegistrationScene extends BaseScene<SceneContext> {
  private readonly logger: UniversalLogger;
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerService,
  ) {
    super('registration');
    this.logger = this.loggerService.getLogger('RegistrationScene');
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext) {
    if (!ctx.from) {
      this.logger.error('ctx.from is undefined in onSceneEnter');
      await ctx.scene.leave();
      return;
    }
    this.logger.info(`Entering registration scene for user ${ctx.from.id}`);
    await ctx.reply('Введите ваше имя:');
  }

  @On('text')
  async onText(@Ctx() ctx: SceneContext & { message: { text: string } }) {
    if (!ctx.from) {
      this.logger.error('ctx.from is undefined in onText');
      await ctx.scene.leave();
      return;
    }
    const state = ctx.scene.state as any;
    if (!state.name) {
      state.name = ctx.message.text;
      await ctx.reply('Введите ваш Wildberries ID:');
    } else {
      state.wildberriesId = ctx.message.text;
      await this.saveUser(ctx);
      await ctx.scene.leave();
    }
  }

  async saveUser(ctx: SceneContext) {
    if (!ctx.from) {
      this.logger.error('ctx.from is undefined in saveUser');
      await ctx.scene.leave();
      return;
    }
    const state = ctx.scene.state as any;
    const user = await this.prisma.user.create({
      data: {
        telegramId: ctx.from.id,
        telegramUsername: ctx.from.username,
        name: state.name,
        wildberriesId: state.wildberriesId,
      },
    });
    this.logger.info(`User ${user.name} created with id ${user.id}`);
    await ctx.reply(`Спасибо за регистрацию, ${user.name}!`);
  }
}
