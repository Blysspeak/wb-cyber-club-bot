import { bot } from './botInit.js'
import { MenuController } from './menu/menuController.js'

bot.command('menu', MenuController.sendMenu)

// User Menu
bot.hears('👤 Мой профиль', ctx => ctx.reply('Тут будет профиль'))
bot.hears('📊 Статистика', ctx => ctx.reply('Тут будет статистика'))
bot.hears('🛡️ Моя команда', ctx => ctx.reply('Тут будет инфо о команде'))
bot.hears('➕ Создать команду', ctx => ctx.reply('Тут будет создание команды'))
bot.hears('🤝 Вступить в команду', ctx => ctx.reply('Тут будет вступление в команду'))
bot.hears('❓ Помощь', ctx => ctx.reply('Тут будет помощь'))

// Admin Menu
bot.hears('🏆 Управление турнирами', ctx => ctx.reply('Тут будет управление турнирами'))
bot.hears('👥 Управление пользователями', ctx => ctx.reply('Тут будет управление пользователями'))
bot.hears('📈 Общая статистика', ctx => ctx.reply('Тут будет общая статистика'))
bot.hears('🔙 Главное меню', MenuController.sendMenu)

// Captain Menu
bot.hears('🛡️ Управление командой', ctx => ctx.reply('Тут будет управление командой'))
bot.hears('🏆 Мои турниры', ctx => ctx.reply('Тут будет инфо о турнирах'))

export const setupBot = () => {
  return bot
}
