import { getTeamOverviewMenu, getTeamManageMenu, getTeamSettingsMenu } from './captainMenu/captainMenu.js'
import { getUserMenu } from './userMenu/userMenu.js'
import userService from '#userService'
import { getAdminMenu } from './adminMenu/adminMenu.js'
import { getTournamentsMenu } from './adminMenu/tournamentsMenu.js'
import { getUsersMenu } from './adminMenu/usersMenu.js'
import { SUPERADMIN_IDS } from '#utils'

const superSet = new Set(
  String(SUPERADMIN_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

export class MenuController {
  static async sendMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)

    if (!user) {
      return ctx.reply('Сначала нужно зарегистрироваться. Введите /start')
    }

    const isSuper = superSet.has(String(user.telegramId))
    if (user.role === 'ADMIN' || isSuper) {
      ctx.session.menuState = 'ADMIN_MAIN'
      const kb = getAdminMenu()
      return ctx.reply('Админ-панель:', { reply_markup: kb.reply_markup })
    }

    const menu = getUserMenu(user)
    ctx.session.menuState = 'MAIN'
    ctx.reply('Главное меню:', { reply_markup: menu.reply_markup })
  }

  static async sendTournamentsMenu(ctx) {
    ctx.session.menuState = 'ADMIN_TOURNAMENTS'
    const kb = getTournamentsMenu()
    return ctx.reply('Настройка турниров:', { reply_markup: kb.reply_markup })
  }

  static async sendUsersMenu(ctx) {
    ctx.session.menuState = 'ADMIN_USERS'
    const kb = getUsersMenu()
    return ctx.reply('Управление пользователями:', { reply_markup: kb.reply_markup })
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

  static async sendAdminMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    const isSuper = user && superSet.has(String(user.telegramId))
    if (!user || (user.role !== 'ADMIN' && !isSuper)) {
      return ctx.reply('Доступ только для администраторов')
    }
    ctx.session.menuState = 'ADMIN_MAIN'
    const kb = getAdminMenu()
    return ctx.reply('Админ-панель:', { reply_markup: kb.reply_markup })
  }
}
