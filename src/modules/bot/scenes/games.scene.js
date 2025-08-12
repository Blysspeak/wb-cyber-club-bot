import { Scenes, Markup } from 'telegraf'
import userService from '#userService'

const AVAILABLE_GAMES = ['MLBB', 'CS2', 'PUBG']

const kb = () =>
  Markup.keyboard([...AVAILABLE_GAMES, '✅ Готово', '⬅️ Назад'], { columns: 3 }).resize()

export const gamesScene = new Scenes.WizardScene(
  'games',
  async ctx => {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    ctx.wizard.state.games = new Set(user?.games || [])
    await ctx.reply(
      `Выбери игры (нажимай, чтобы добавить/убрать). Когда закончишь — нажми "✅ Готово".`,
      kb()
    )
    return ctx.wizard.next()
  },
  async ctx => {
    const text = ctx.message?.text
    if (!text) return

    if (text === '✅ Готово') {
      if (ctx.wizard.state.games.size === 0) {
        await ctx.reply('Нужно выбрать минимум одну игру.')
        return
      }
      if (ctx.wizard.state.games.has('MLBB')) {
        await ctx.reply('Укажи MLBB ID (обязательно):')
        return ctx.wizard.next()
      }
      return ctx.wizard.selectStep(3)
    }

    if (text === '⬅️ Назад') {
      await ctx.reply('Отмена')
      return ctx.scene.leave()
    }

    if (AVAILABLE_GAMES.includes(text)) {
      if (ctx.wizard.state.games.has(text)) ctx.wizard.state.games.delete(text)
      else ctx.wizard.state.games.add(text)
      await ctx.reply(`Выбрано: ${[...ctx.wizard.state.games].join(', ') || '-'}`, kb())
    }
  },
  async ctx => {
    const text = ctx.message?.text?.trim()
    if (!text) {
      await ctx.reply('MLBB ID обязателен. Введите значение:')
      return
    }
    ctx.wizard.state.mlbbId = text
    await ctx.reply('Укажи MLBB сервер (обязательно):')
    return ctx.wizard.next()
  },
  async ctx => {
    const text = ctx.message?.text?.trim()
    if (!text) {
      await ctx.reply('MLBB сервер обязателен. Введите значение:')
      return
    }
    ctx.wizard.state.mlbbServer = text

    try {
      const updated = await userService.updateUserProfile(ctx.from.id, {
        games: [...ctx.wizard.state.games],
        mlbbId: ctx.wizard.state.mlbbId,
        mlbbServer: ctx.wizard.state.mlbbServer
      })
      await ctx.reply(`Игры обновлены: ${updated.games.join(', ')}`)
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка сохранения игр: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 