import { getAdminMenu } from './adminMenu/adminMenu.js'
import { getCaptainMenu } from './captainMenu/captainMenu.js'
import { getUserMenu } from './userMenu/userMenu.js'
import userService from '#userService'

const roles = {
  user: 'PLAYER',
  admin: 'ADMIN',
  captain: 'CAPTAIN'
}

export class MenuController {
  static async sendMenu(ctx) {
    const user = await userService.getUserByTelegramId(ctx.from.id)

    if (!user) {
      return ctx.reply('Сначала нужно зарегистрироваться. Введите /start')
    }

    let menu
    switch (user.role) {
      case roles.admin:
        menu = getAdminMenu()
        break
      case roles.captain:
        menu = getCaptainMenu()
        break
      default:
        menu = getUserMenu(user)
        break
    }
    ctx.reply('Главное меню:', menu)
  }
}
