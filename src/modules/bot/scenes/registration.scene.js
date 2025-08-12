import { Scenes } from 'telegraf'
import userService from '../../../services/db/user.service.js'
import { MenuController } from '../menu/menuController.js'

const ask = async (ctx, text) => ctx.reply(text)

export const registerScene = new Scenes.WizardScene(
  'register',
  async ctx => {
    ctx.wizard.state.data = { telegramId: ctx.from.id, telegramUsername: ctx.from.username || null }
    await ask(ctx, 'Введи свой Wildberries ID:')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (!input) {
      await ask(ctx, 'Пожалуйста, введи корректный Wildberries ID:')
      return
    }
    ctx.wizard.state.data.wildberriesId = input
    await ask(ctx, 'Как тебя зовут? (Имя)')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (!input) {
      await ask(ctx, 'Пожалуйста, введи имя:')
      return
    }
    ctx.wizard.state.data.name = input
    await ask(ctx, 'Введи игровой никнейм:')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (!input) {
      await ask(ctx, 'Пожалуйста, введи никнейм:')
      return
    }
    ctx.wizard.state.data.nickname = input
    await ask(ctx, 'Укажи Discord (или напиши "пропустить"):')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (input && input.toLowerCase() !== 'пропустить') {
      ctx.wizard.state.data.discord = input
    }
    await ask(ctx, 'Дата рождения в формате ГГГГ-ММ-ДД (или напиши "пропустить"):')
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (input && input.toLowerCase() !== 'пропустить') {
      const date = new Date(input)
      if (isNaN(date.getTime())) {
        await ask(ctx, 'Неверный формат даты. Введи ГГГГ-ММ-ДД или "пропустить":')
        return
      }
      ctx.wizard.state.data.birthDate = input
    }

    try {
      const user = await userService.registerUser(ctx.wizard.state.data)
      await ctx.reply('Регистрация завершена!')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    } catch (err) {
      await ctx.reply(`Ошибка регистрации: ${err.message}`)
      return ctx.scene.leave()
    }
  }
) 