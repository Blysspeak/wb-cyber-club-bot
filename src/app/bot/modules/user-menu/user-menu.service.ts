import { BotLogger } from '#logger';
import { Inject, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Context } from 'telegraf';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { userMenuTemplate } from './user-menu.template';

@Injectable()
export class UserMenuService {
  constructor(
    @Inject('BotLogger') private readonly logger: BotLogger,
    private readonly prisma: PrismaService,
  ) {}

  private async findOrCreateUser(ctx: Context): Promise<User | null> {
    if (!ctx.from) {
      this.logger.warn(
        'Cannot find or create user: ctx.from is undefined',
        'UserMenuService',
      );
      return null;
    }
    const { id, username, first_name } = ctx.from;

    this.logger.info(
      `Поиск или создание пользователя ${id}`,
      'UserMenuService',
    );

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(id) },
      update: {
        telegramUsername: username,
        name: first_name,
      },
      create: {
        telegramId: BigInt(id),
        telegramUsername: username,
        name: first_name,
        wildberriesId: '',
      },
    });

    return user;
  }

  async sendMenu(ctx: Context) {
    const user = await this.findOrCreateUser(ctx);

    if (!user) {
      return;
    }

    if (user.wildberriesId === '') {
      await ctx.reply(
        'Добро пожаловать! Мы сохранили ваш профиль. Пожалуйста, завершите регистрацию, чтобы получить доступ ко всем функциям.',
        userMenuTemplate.notRegisteredMenu(),
      );
      return;
    }

    const isInTeam = !!user.teamId;
    const welcomeMessage = `Добро пожаловать, ${user.name}!`;

    if (isInTeam) {
      await ctx.reply(welcomeMessage, userMenuTemplate.teamMemberMenu());
    } else {
      await ctx.reply(welcomeMessage, userMenuTemplate.noTeamMenu());
    }
  }
}
