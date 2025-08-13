import { Scenes, Markup } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'

const escapeHtml = s => String(s)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const userDisplayName = u => u.nickname || u.name || u.telegramUsername || u.id

const userLink = u => {
  const label = escapeHtml(userDisplayName(u))
  if (u.telegramUsername) {
    return `<a href="https://t.me/${escapeHtml(u.telegramUsername)}">${label}</a>`
  }
  if (u.telegramId) {
    return `<a href="tg://user?id=${String(u.telegramId)}">${label}</a>`
  }
  return label
}

const formatMemberLine = u => {
  const wb = u.wildberriesId ? `WB: <b>${escapeHtml(u.wildberriesId)}</b>` : 'WB: -'
  const mlbbId = u.mlbbId ? `MLBB: <b>${escapeHtml(u.mlbbId)}</b>` : 'MLBB: -'
  const mlbbSrv = u.mlbbServer ? `Srv: <b>${escapeHtml(u.mlbbServer)}</b>` : 'Srv: -'
  return `• ${userLink(u)} — ${wb}; ${mlbbId}; ${mlbbSrv}`
}

const formatTeamInfoHtml = app => {
  const team = app.team
  const captain = team.captain
  const members = team.members || []

  const title = `🛡️ Команда: <b>${escapeHtml(team.name)}</b> (${escapeHtml(team.acronym)})`
  const tournament = `🏆 Турнир: <b>${escapeHtml(app.tournament.name)}</b>`
  const captainLine = captain
    ? `👨‍✈️ Капитан: ${userLink(captain)}`
    : '👨‍✈️ Капитан: -'
  const membersTitle = '👥 Состав:'
  const membersLines = members.map(formatMemberLine).join('\n')

  return [title, tournament, captainLine, membersTitle, membersLines].filter(Boolean).join('\n')
}

export const adminPendingApplicationsScene = new Scenes.BaseScene('adminPendingApplications')

adminPendingApplicationsScene.enter(async ctx => {
  const isAdmin = await userService.isAdmin(ctx.from.id)
  if (!isAdmin) {
    await ctx.reply('Доступ только для администраторов')
    return ctx.scene.leave()
  }

  const apps = await tournamentAdminService.getPendingApplications()
  if (!apps.length) {
    await ctx.reply('Заявок на модерации нет')
    return ctx.scene.leave()
  }

  for (const app of apps.slice(0, 10)) {
    const text = formatTeamInfoHtml(app)
    const kb = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Одобрить', `app_approve:${app.id}`),
        Markup.button.callback('❌ Отклонить', `app_reject:${app.id}`)
      ]
    ])
    await ctx.reply(text, { reply_markup: kb.reply_markup, parse_mode: 'HTML', disable_web_page_preview: true })
  }

  return ctx.scene.leave()
}) 