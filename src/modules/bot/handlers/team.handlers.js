import userService from '#userService'
import { MenuController } from '../menu/menuController.js'

const escapeHtml = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const linkUser = u => {
  const display = escapeHtml(u.nickname || u.name || u.telegramUsername || u.id)
  const usernameClean = u.telegramUsername ? String(u.telegramUsername).replace(/^@/, '') : ''
  const visibleHandle = usernameClean ? ` (@${usernameClean})` : ''
  const id = u.telegramId ? String(u.telegramId) : null
  if (id) return `<a href="tg://user?id=${id}">${display}</a>${visibleHandle}`
  if (usernameClean) return `<a href="https://t.me/${usernameClean}">${display}</a>${visibleHandle}`
  return display
}

export const sendTeamRosterRich = async ctx => {
  const team = await userService.getTeamMembers(ctx.from.id)
  if (!team) {
    return ctx.reply('Вы не состоите в команде')
  }

  const title = `<b>Команда:</b> ${escapeHtml(team.name)} (${escapeHtml(team.acronym)})`
  const description = `<b>Описание:</b> ${escapeHtml(team.description || '-')}`

  const captainLine = team.captain ? `- ${linkUser(team.captain)} <b>(CAPTAIN)</b>` : ''
  const memberLines = (team.members || [])
    .filter(m => !team.captain || m.id !== team.captain.id)
    .map(m => `- ${linkUser(m)} <i>(${escapeHtml(m.role)})</i>`) // role italic
    .join('\n')
  const roster = `<b>Состав:</b>\n${[captainLine, memberLines].filter(Boolean).join('\n')}`

  // If logo exists, send photo first with title+desc, then roster
  if (team.logo) {
    await ctx.replyWithPhoto(team.logo, {
      caption: `${title}\n${description}`,
      parse_mode: 'HTML'
    })
  }

  return ctx.reply(`${title}\n${description}\n${roster}`, {
    parse_mode: 'HTML'
  })
}

export const onMyTeam = async ctx => {
  try {
    const text = await userService.getTeamInfoText(ctx.from.id)
    await ctx.reply(text)
    await MenuController.sendTeamOverviewMenu(ctx)
  } catch (e) {
    await ctx.reply(e.message)
  }
}

export const onTeamOverview = async ctx => MenuController.sendTeamOverviewMenu(ctx)
export const onTeamManage = async ctx => MenuController.sendTeamManageMenu(ctx)
export const onTeamSettings = async ctx => MenuController.sendTeamSettingsMenu(ctx) 