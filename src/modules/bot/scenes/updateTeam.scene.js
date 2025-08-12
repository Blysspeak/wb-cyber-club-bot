import { Scenes } from 'telegraf'
import userService from '#userService'
import { MenuController } from '../menu/menuController.js'

const ask = (ctx, text) => ctx.reply(text)
const isSkip = txt => txt && txt.toLowerCase() === 'пропустить'

export const updateTeamScene = new Scenes.WizardScene(
  'updateTeam',
  async ctx => {
    try {
      const team = await userService.getUserTeam(ctx.from.id)
      if (!team) {
        await ctx.reply('Доступно только для капитанов команды')
        return ctx.scene.leave()
      }
      ctx.wizard.state.update = {}
      ctx.wizard.state.team = team
      await ask(
        ctx,
        `Текущее название: ${team.name}\nВведи новое название или напиши "пропустить":`
      )
      return ctx.wizard.next()
    } catch (e) {
      await ctx.reply('Ошибка получения команды')
      return ctx.scene.leave()
    }
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (input && !isSkip(input)) {
      ctx.wizard.state.update.name = input
    }
    await ask(
      ctx,
      `Текущий акроним: ${ctx.wizard.state.team.acronym}\nВведи новый (2-4 заглавных латинских) или "пропустить":`
    )
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()?.toUpperCase()
    if (input && !isSkip(input)) {
      if (input.length < 2 || input.length > 4 || /[^A-Z]/.test(input)) {
        return ask(ctx, 'Акроним должен быть 2-4 заглавных латинских буквы. Повтори или напиши "пропустить":')
      }
      ctx.wizard.state.update.acronym = input
    }
    await ask(
      ctx,
      `Текущее описание: ${ctx.wizard.state.team.description || '-'}\nВведи новое описание или "пропустить":`
    )
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (input && !isSkip(input)) {
      ctx.wizard.state.update.description = input
    }
    await ask(
      ctx,
      `Текущий логотип: ${ctx.wizard.state.team.logo || '-'}\nВставь URL нового логотипа или "пропустить":`
    )
    return ctx.wizard.next()
  },
  async ctx => {
    const input = ctx.message?.text?.trim()
    if (input && !isSkip(input)) {
      ctx.wizard.state.update.logo = input
    }

    try {
      const updated = await userService.updateTeam(ctx.from.id, ctx.wizard.state.update)
      await ctx.reply(`Команда обновлена: ${updated.name} (${updated.acronym})`)
      const info = await userService.getTeamInfoText(ctx.from.id)
      await ctx.reply(info)
      await MenuController.sendManageTeamMenu(ctx)
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка обновления команды: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 