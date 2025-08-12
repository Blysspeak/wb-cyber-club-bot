import { Scenes, Markup } from 'telegraf'
import userService from '#userService'
import { MenuController } from '../menu/menuController.js'
import { buttons } from '#buttons'

const ask = (ctx, text, keyboard) => ctx.reply(text, keyboard ? { reply_markup: keyboard.reply_markup } : undefined)

const escapeHtml = text => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const buildMemberLabel = user => {
  const displayName = user.nickname || user.name || user.telegramUsername || String(user.id)
  const usernameClean = user.telegramUsername ? String(user.telegramUsername).replace(/^@/, '') : ''
  const handle = usernameClean ? ` (@${handleSafe(usernameClean)})` : ''
  return `${displayName}${handle}`
}

const handleSafe = s => String(s)

export const removePlayerScene = new Scenes.WizardScene(
  'removePlayer',
  async ctx => {
    const me = await userService.getUserByTelegramId(ctx.from.id)
    if (!me || me.role !== 'CAPTAIN') {
      await ctx.reply('Доступно только для капитанов команды')
      return ctx.scene.leave()
    }

    // Load team members and build a keyboard
    const team = await userService.getTeamMembers(ctx.from.id)
    if (!team) {
      await ctx.reply('Сначала создайте или вступите в команду')
      return ctx.scene.leave()
    }

    const members = (team.members || []).filter(m => m.id !== team.captain.id)
    if (members.length === 0) {
      await ctx.reply('В команде нет игроков для удаления')
      return ctx.scene.leave()
    }

    const labels = members.map(buildMemberLabel)
    const labelToMember = new Map(labels.map((label, idx) => [label, members[idx]]))

    ctx.wwizard = ctx.wizard // alias
    ctx.wizard.state.memberLabels = labels
    ctx.wizard.state.labelToMember = labelToMember
    ctx.wizard.state.team = { name: team.name, acronym: team.acronym }

    const kb = Markup.keyboard([...labels, buttons.BACK], { columns: 2 }).resize()
    await ask(ctx, 'Выбери игрока для удаления из команды:', kb)
    return ctx.wizard.next()
  },
  async ctx => {
    const text = ctx.message?.text?.trim()
    if (!text) {
      await ctx.reply('Выбери игрока кнопкой ниже')
      return
    }

    if (text === buttons.BACK) {
      await MenuController.sendTeamManageMenu(ctx)
      return ctx.scene.leave()
    }

    const labelToMember = ctx.wizard.state.labelToMember
    const member = labelToMember?.get(text)
    if (!member) {
      await ctx.reply('Выбери игрока из списка ниже')
      return
    }

    try {
      await userService.removePlayer(ctx.from.id, member.id)

      const team = ctx.wizard.state.team
      const usernameClean = member.telegramUsername ? String(member.telegramUsername).replace(/^@/, '') : ''
      const memberDisplay = escapeHtml(member.nickname || member.name || member.telegramUsername || String(member.id))
      const memberHandle = usernameClean ? ` (@${escapeHtml(usernameClean)})` : ''

      // Captain confirmation
      await ctx.reply(
        `🗑 Игрок <b>${memberDisplay}</b>${memberHandle} исключен из команды <b>${escapeHtml(team.name)} (${escapeHtml(team.acronym)})</b>.`,
        { parse_mode: 'HTML' }
      )

      // Notify removed player
      if (member.telegramId) {
        const notice = `⚠️ Вас исключили из команды <b>${escapeHtml(team.name)} (${escapeHtml(team.acronym)})</b>.
Напишите /menu, чтобы обновить меню.`
        try {
          await ctx.telegram.sendMessage(Number(member.telegramId), notice, { parse_mode: 'HTML' })
        } catch {
          // ignore delivery errors
        }
      }

      await MenuController.sendTeamManageMenu(ctx)
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 