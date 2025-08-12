import { Scenes } from 'telegraf'
import userService from '#userService'
import { MenuController } from '../menu/menuController.js'

const ask = (ctx, text) => ctx.reply(text)

export const createTeamScene = new Scenes.WizardScene(
  'createTeam',
  async ctx => {
    ctx.wizard.state.data = {}
    await ask(ctx, 'Название команды?')
    return ctx.wizard.next()
  },
  async ctx => {
    const name = ctx.message?.text?.trim()
    if (!name) return ask(ctx, 'Введите корректное название команды')
    ctx.wizard.state.data.name = name
    await ask(ctx, 'Акроним (2-4 буквы, латиница)?')
    return ctx.wizard.next()
  },
  async ctx => {
    const ac = ctx.message?.text?.trim()?.toUpperCase()
    if (!ac || ac.length < 2 || ac.length > 4 || /[^A-Z]/.test(ac)) {
      return ask(ctx, 'Акроним должен быть 2-4 заглавных латинских буквы. Повторите:')
    }
    ctx.wizard.state.data.acronym = ac
    await ask(ctx, 'Описание (или "пропустить"):')
    return ctx.wizard.next()
  },
  async ctx => {
    const desc = ctx.message?.text?.trim()
    if (desc && desc.toLowerCase() !== 'пропустить') {
      ctx.wizard.state.data.description = desc
    }
    await ask(ctx, 'Логотип (URL) или "пропустить":')
    return ctx.wizard.next()
  },
  async ctx => {
    const logo = ctx.message?.text?.trim()
    if (logo && logo.toLowerCase() !== 'пропустить') {
      ctx.wizard.state.data.logo = logo
    }

    try {
      const team = await userService.createTeam(ctx.from.id, {
        name: ctx.wizard.state.data.name,
        acronym: ctx.wizard.state.data.acronym,
        description: ctx.wizard.state.data.description,
        logo: ctx.wizard.state.data.logo
      })
      await ctx.reply(`Команда создана: ${team.name} (${team.acronym})`)
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 