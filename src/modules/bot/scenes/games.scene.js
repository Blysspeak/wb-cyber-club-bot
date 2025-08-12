import { Scenes, Markup } from 'telegraf'
import userService from '#userService'

const AVAILABLE_GAMES = ['MLBB', 'CS2', 'PUBG']

const kb = () =>
  Markup.keyboard([...AVAILABLE_GAMES, '✅ Готово', '⬅️ Назад'], { columns: 3 }).resize()

export const gamesScene = new Scenes.WizardScene(
  'games',
  async ctx => {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    ctx.wizard.state.existing = new Set(user?.games || [])
    ctx.wizard.state.selected = new Set()
    await ctx.reply(
      `Выбери игры (добавление только). Уже выбранные нельзя убрать. Когда закончишь — нажми "✅ Готово".`,
      kb()
    )
    return ctx.wizard.next()
  },
  async ctx => {
    const text = ctx.message?.text
    if (!text) return

    if (text === '✅ Готово') {
      const union = new Set([...ctx.wizard.state.existing, ...ctx.wizard.state.selected])
      if (union.size === 0) {
        await ctx.reply('Нужно выбрать минимум одну игру.')
        return
      }
      ctx.wizard.state.unionGames = [...union]

      const user = await userService.getUserByTelegramId(ctx.from.id)
      const hasMLBB = union.has('MLBB')
      const newlyAddedMLBB = ctx.wizard.state.selected.has('MLBB')
      const missingMlbb = !user?.mlbbId || !user?.mlbbServer

      if (hasMLBB && (newlyAddedMLBB || missingMlbb)) {
        await ctx.reply('Укажи MLBB ID (обязательно):')
        return ctx.wizard.next()
      }

      try {
        const updated = await userService.updateUserProfile(ctx.from.id, {
          games: ctx.wizard.state.unionGames
        })
        await ctx.reply(`Игры обновлены: ${updated.games.join(', ')}`)
        return ctx.scene.leave()
      } catch (e) {
        await ctx.reply(`Ошибка сохранения игр: ${e.message}`)
        return ctx.scene.leave()
      }
    }

    if (text === '⬅️ Назад') {
      await ctx.reply('Отмена')
      return ctx.scene.leave()
    }

    if (!AVAILABLE_GAMES.includes(text)) return

    if (text === 'CS2' || text === 'PUBG') {
      await ctx.reply('Выбор этой игры пока в разработке')
      return
    }

    // Additive-only selection
    if (ctx.wizard.state.existing.has(text) || ctx.wizard.state.selected.has(text)) {
      await ctx.reply(`Игра уже выбрана: ${text}`, kb())
      return
    }

    ctx.wizard.state.selected.add(text)
    const union = new Set([...ctx.wizard.state.existing, ...ctx.wizard.state.selected])
    await ctx.reply(`Выбрано: ${[...union].join(', ') || '-'}`, kb())
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
        games: ctx.wizard.state.unionGames,
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