import { BotLogger } from '#logger';
import { Controller, Inject } from '@nestjs/common';
import { Ctx, Hears, On, Start } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserMenuService } from './user-menu.service';
import { userMenuTemplate } from './user-menu.template';

@Controller()
export class UserMenuController {
  constructor(
    private readonly userMenuService: UserMenuService,
    @Inject('BotLogger') private readonly logger: BotLogger,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.userMenuService.sendMenu(ctx);
  }

  @Hears(userMenuTemplate.buttons.profile)
  async onProfile(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Мой профиль"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет информация о профиле.');
  }

  @Hears(userMenuTemplate.buttons.stats)
  async onStats(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Статистика"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет статистика.');
  }

  @Hears(userMenuTemplate.buttons.myTeam)
  async onMyTeam(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Моя команда"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет информация о команде.');
  }

  @Hears(userMenuTemplate.buttons.createTeam)
  async onCreateTeam(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Создать команду"`,
      'UserMenuController',
    );
    await ctx.reply('Здесть будет функционал создания команды.');
  }

  @Hears(userMenuTemplate.buttons.joinTeam)
  async onJoinTeam(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Вступить в команду"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет функционал для вступления в команду.');
  }

  @Hears(userMenuTemplate.buttons.help)
  async onHelp(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Помощь"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет раздел помощи.');
  }

  @Hears(userMenuTemplate.buttons.completeRegistration)
  async onCompleteRegistration(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.logger.info(
      `Пользователь ${ctx.from.id} нажал на "Завершить регистрацию"`,
      'UserMenuController',
    );
    await ctx.reply('Здесь будет сценарий для завершения регистрации.');
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const message = (ctx.message as any).text;
    const knownButtons = Object.values(userMenuTemplate.buttons);

    if (!knownButtons.includes(message)) {
      this.logger.info(
        `Неизвестная команда от ${ctx.from.id}: ${message}`,
        'UserMenuController',
      );
      await this.userMenuService.sendMenu(ctx);
    }
  }
}
