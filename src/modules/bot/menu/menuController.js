import { getTeamOverviewMenu, getTeamManageMenu, getTeamSettingsMenu } from './captainMenu/captainMenu.js'
import { getUserMenu } from './userMenu/userMenu.js'
import userService from '#userService'

export class MenuController {
  static async sendMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)

    if (!user) {
      return ctx.reply('Сначала нужно зарегистрироваться. Введите /start')
    }

    const menu = getUserMenu(user)
    ctx.session.menuState = 'MAIN'
    ctx.reply('Главное меню:', { reply_markup: menu.reply_markup })
  }

  static async sendTeamOverviewMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user || !user.team) {
      return ctx.reply('Сначала создайте или вступите в команду')
    }
    ctx.session.menuState = 'TEAM_OVERVIEW'
    const isCaptain = user.role === 'CAPTAIN'
    const kb = getTeamOverviewMenu(isCaptain)
    return ctx.reply('Моя команда:', { reply_markup: kb.reply_markup })
  }

  static async sendTeamManageMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user || user.role !== 'CAPTAIN') {
      return ctx.reply('Доступно только для капитанов команды')
    }
    ctx.session.menuState = 'TEAM_MANAGE'
    const kb = getTeamManageMenu()
    return ctx.reply('Управление составом:', { reply_markup: kb.reply_markup })
  }

  static async sendTeamSettingsMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user || user.role !== 'CAPTAIN') {
      return ctx.reply('Доступно только для капитанов команды')
    }
    ctx.session.menuState = 'TEAM_SETTINGS'
    const kb = getTeamSettingsMenu()
    return ctx.reply('Настройки команды:', { reply_markup: kb.reply_markup })
  }
}
