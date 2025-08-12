import { createBot } from './botInit.js'
import { MenuController } from './menu/menuController.js'
import userService from '../../services/db/user.service.js'

export const setupBot = () => {
  const bot = createBot()

  if (!bot) {
    return null
  }

  bot.command('menu', MenuController.sendMenu)

  // User Menu
  bot.hears('👤 Мой профиль', async ctx => {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user) return ctx.reply('Вы не зарегистрированы. Введите /start')
    return ctx.reply(`Профиль:\nИмя: ${user.name}\nНик: ${user.nickname}\nРоль: ${user.role}`)
  })
  bot.hears('📊 Статистика', async ctx => {
    const stats = await userService.getUserStats(ctx.from.id)
    return ctx.reply(
      `Статистика:\nТурниров: ${stats.totalTournaments}\nЗаявок: ${stats.totalApplications}`
    )
  })
  bot.hears('🛡️ Моя команда', async ctx => {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (!user?.team) return ctx.reply('Вы не состоите в команде')
    const t = user.team
    return ctx.reply(`Команда: ${t.name} (${t.acronym})`)
  })
  bot.hears('➕ Создать команду', ctx => ctx.reply('Создание команды — скоро'))
  bot.hears('🤝 Вступить в команду', ctx => ctx.reply('Вступление в команду — скоро'))
  bot.hears('❓ Помощь', ctx => ctx.reply('Помощь — скоро'))

  // Admin Menu
  bot.hears('🏆 Управление турнирами', ctx => ctx.reply('Управление турнирами — скоро'))
  bot.hears('👥 Управление пользователями', ctx => ctx.reply('Управление пользователями — скоро'))
  bot.hears('📈 Общая статистика', ctx => ctx.reply('Общая статистика — скоро'))
  bot.hears('🔙 Главное меню', MenuController.sendMenu)

  // Captain Menu
  bot.hears('🛡️ Управление командой', ctx => ctx.reply('Управление командой — скоро'))
  bot.hears('🏆 Мои турниры', ctx => ctx.reply('Мои турниры — скоро'))

  return bot
}
