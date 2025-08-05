import { getAdminMenu } from './adminMenu/adminMenu.js'
import { getCaptainMenu } from './captainMenu/captainMenu.js'
import { getUserMenu } from './userMenu/userMenu.js'
// import User from '../models/user.model.js' // We will need user model later

const roles = {
  user: 'user',
  admin: 'admin',
  captain: 'captain'
}

export class MenuController {
  static async sendMenu(ctx) {
    // For now, we will use a mock user. Later we will get the user from the database.
    const user = {
      role: roles.user,
      team: null
    }
    // const user = await User.findOne({ telegramId: ctx.from.id })

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
