import { createBot } from './botInit.js'
import { MenuController } from './menu/menuController.js'
import { buttons } from '#buttons'
import { onProfile, onStats } from './handlers/profile.handlers.js'
import { onMyTeam, onManageTeam } from './handlers/team.handlers.js'
import { onGames } from './handlers/games.handlers.js'

export const setupBot = () => {
  const bot = createBot()

  if (!bot) {
    return null
  }

  bot.command('menu', MenuController.sendMenu)

  // User Menu
  bot.hears(buttons.PROFILE, onProfile)
  bot.hears(buttons.STATS, onStats)
  bot.hears(buttons.MY_TEAM, onMyTeam)
  bot.hears(buttons.CREATE_TEAM, async ctx => ctx.scene.enter('createTeam'))
  bot.hears(buttons.JOIN_TEAM, ctx => ctx.reply('Вступление в команду — скоро'))
  bot.hears(buttons.GAMES, onGames)
  bot.hears(buttons.HELP, ctx => ctx.reply('Помощь — скоро'))

  // Manage Team submenu
  bot.hears(buttons.MANAGE_TEAM, onManageTeam)
  bot.hears(buttons.TEAM_VIEW, ctx => ctx.reply('Просмотр состава — скоро'))
  bot.hears(buttons.TEAM_INVITE, ctx => ctx.reply('Пригласить игрока — скоро'))
  bot.hears(buttons.TEAM_REMOVE, ctx => ctx.reply('Удалить игрока — скоро'))
  bot.hears(buttons.TEAM_UPDATE, ctx => ctx.scene.enter('updateTeam'))
  bot.hears(buttons.TEAM_INVITATIONS, ctx => ctx.reply('Приглашения — скоро'))
  bot.hears(buttons.TEAM_STATS, ctx => ctx.reply('Статистика команды — скоро'))
  bot.hears(buttons.TEAM_APPLY, ctx => ctx.reply('Заявка на турнир — скоро'))
  bot.hears(buttons.TEAM_APPS, ctx => ctx.reply('Заявки команды — скоро'))
  bot.hears(buttons.TEAM_TOURNAMENTS, ctx => ctx.reply('Активные турниры — скоро'))
  bot.hears(buttons.BACK, MenuController.sendMenu)

  // Admin Menu
  bot.hears(buttons.MANAGE_TOURNAMENTS, ctx => ctx.reply('Управление турнинами — скоро'))
  bot.hears(buttons.MANAGE_USERS, ctx => ctx.reply('Управление пользователями — скоро'))
  bot.hears(buttons.OVERALL_STATS, ctx => ctx.reply('Общая статистика — скоро'))
  bot.hears(buttons.MAIN_MENU, MenuController.sendMenu)

  return bot
}
