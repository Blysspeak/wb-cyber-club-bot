import { Scenes } from 'telegraf'
import userService from '#userService'

const ask = (ctx, text) => ctx.reply(text)

export const removePlayerScene = new Scenes.WizardScene(
  'removePlayer',
  async ctx => {
    const me = await userService.getUserByTelegramId(ctx.from.id)
    if (!me || me.role !== 'CAPTAIN') {
      await ctx.reply('Доступно только для капитанов команды')
      return ctx.scene.leave()
    }
    await ask(ctx, 'Введи Telegram ID или @username игрока для удаления из команды:')
    return ctx.wizard.next()
  },
  async ctx => {
    const raw = ctx.message?.text?.trim()
    if (!raw) return ask(ctx, 'Укажи корректный ID или @username:')

    let target = null
    if (/^\d{6,}$/.test(raw)) {
      target = await userService.getUserByTelegramId(raw)
    } else {
      target = await userService.getUserByTelegramUsername(raw)
    }

    if (!target) {
      await ctx.reply('Пользователь не найден в системе.')
      return ctx.scene.leave()
    }

    try {
      await userService.removePlayer(ctx.from.id, target.id)
      await ctx.reply('Игрок удален из команды')
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 