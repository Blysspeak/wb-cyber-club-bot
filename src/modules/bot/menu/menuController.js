import { getManageTeamMenu } from './captainMenu/captainMenu.js'
import { getUserMenu } from './userMenu/userMenu.js'
import userService from '#userService'

export class MenuController {
  static async sendMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)

    if (!user) {
      return ctx.reply('Сначала нужно зарегистрироваться. Введите /start')
    }

    const menu = getUserMenu(user)
    ctx.reply('Главное меню:', menu)
  }

  static async sendManageTeamMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user || user.role !== 'CAPTAIN') {
      return ctx.reply('Доступно только для капитанов команды')
    }
    return ctx.reply('Управление командой:', getManageTeamMenu())
  }
}
