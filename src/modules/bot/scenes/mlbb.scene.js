import { Scenes } from 'telegraf'
import userService from '#userService'

const ask = (ctx, text) => ctx.reply(text)

export const mlbbScene = new Scenes.WizardScene(
  'mlbb',
  async ctx => {
    await ask(ctx, 'Укажи MLBB ID (обязательно):')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (!input) {
      await ask(ctx, 'MLBB ID обязателен. Введите значение:')
      return
    }
    ctx.wizard.state.mlbbId = input
    await ask(ctx, 'Укажи MLBB сервер (обязательно):')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (!input) {
      await ask(ctx, 'MLBB сервер обязателен. Введите значение:')
      return
    }
    ctx.wizard.state.mlbbServer = input

    try {
      await userService.updateUserProfile(ctx.from.id, {
        mlbbId: ctx.wizard.state.mlbbId,
        mlbbServer: ctx.wizard.state.mlbbServer
      })
      await ctx.reply('MLBB данные сохранены')
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка сохранения MLBB данных: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 