import { Scenes, Markup } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'
import { MenuController } from '../../menu/menuController.js'

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
  const name = userLink(u)
  const tg = u.telegramId ? `| TG ID: <code>${String(u.telegramId)}</code>` : ''
  const wb = u.wildberriesId ? `WB: <code>${escapeHtml(u.wildberriesId)}</code>` : ''
  const mlbb = u.mlbbId && u.mlbbServer ? `MLBB: <code>${escapeHtml(u.mlbbId)} [${escapeHtml(u.mlbbServer)}]</code>` : ''
  return `• ${name} ${tg}\n  ${[wb, mlbb].filter(Boolean).join(' | ')}`
}

const formatTeamInfoHtml = app => {
  const team = app.team
  const captain = team.captain
  const members = team.members || []

  const title = `🔔 <b>Заявка на участие в турнире</b>\n<i>${escapeHtml(app.tournament.name)}</i> от команды <i>${escapeHtml(team.name)}</i>`
  const separator = '-----------------------------------'
  const captainLine = captain
    ? `👨‍✈️ <b>Капитан</b>:\n${formatMemberLine(captain)}`
    : '👨‍✈️ <b>Капитан</b>: -'
  const membersTitle = '👥 <b>Состав</b>:'
  const membersLines = members.filter(m => m.id !== captain?.id).map(formatMemberLine).join('\n\n')

  return [title, separator, captainLine, separator, membersTitle, membersLines].filter(Boolean).join('\n')
}

export const adminPendingApplicationsScene = new Scenes.BaseScene('adminPendingApplications')

adminPendingApplicationsScene.enter(async ctx => {
  const isAdmin = await userService.isAdmin(ctx.from.id)
  if (!isAdmin) {
    await ctx.reply('Доступ только для администраторов')
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }

  const apps = await tournamentAdminService.getPendingApplications()
  if (!apps.length) {
    await ctx.reply('Заявок на модерации нет')
    await MenuController.sendMenu(ctx)
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

  await MenuController.sendMenu(ctx)
  return ctx.scene.leave()
}) 