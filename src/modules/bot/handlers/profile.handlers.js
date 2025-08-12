import userService from '#userService'

const escapeHtml = text => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const mapRole = role => {
  switch (role) {
    case 'CAPTAIN':
      return '🛡️ Капитан'
    case 'ADMIN':
      return '👑 Администратор'
    default:
      return '🎮 Игрок'
  }
}

export const onProfile = async ctx => {
  const user = await userService.getUserByTelegramId(ctx.from.id)
  if (!user) return ctx.reply('Вы не зарегистрированы. Введите /start')

  if (user.games?.includes('MLBB') && (!user.mlbbId || !user.mlbbServer)) {
    await ctx.reply('Нужно заполнить MLBB ID и сервер')
    return ctx.scene.enter('mlbb')
  }

  const games = user.games?.length ? user.games.join(', ') : '-'
  const tgId = String(user.telegramId || ctx.from.id)
  const username = user.telegramUsername ? String(user.telegramUsername).replace(/^@/, '') : ''
  const tgUsernameLine = username
    ? `— Telegram: <a href="https://t.me/${escapeHtml(username)}">@${escapeHtml(username)}</a>`
    : '— Telegram: <i>не указан</i>'

  const mlbbLines = user.games?.includes('MLBB')
    ? `\n🎯 <b>MLBB</b>\n— ID: <code>${escapeHtml(user.mlbbId || '-')}</code>\n— Сервер: <code>${escapeHtml(user.mlbbServer || '-')}</code>`
    : ''

  const teamLines = user.team
    ? `\n🛡️ <b>Команда</b>\n— Название: <b>${escapeHtml(user.team.name)} (${escapeHtml(user.team.acronym)})</b>\n— Статус: <b>${mapRole(user.role)}</b>`
    : `\n🛡️ <b>Команда</b>\n— Вы не состоите в команде`

  const sep = '━━━━━━━━━━━━━━━━━━━━'

  const text = [
    '👤 <b>Профиль</b>',
    sep,
    `— Имя: <b>${escapeHtml(user.name)}</b>`,
    `— Ник: <b>${escapeHtml(user.nickname)}</b>`,
    `— Роль: <b>${mapRole(user.role)}</b>`,
    `— Игры: <b>${escapeHtml(games)}</b>`,
    `— Telegram ID: <code>${escapeHtml(tgId)}</code>`,
    tgUsernameLine,
    sep,
    mlbbLines,
    sep,
    teamLines
  ].filter(Boolean).join('\n')

  return ctx.reply(text, { parse_mode: 'HTML', disable_web_page_preview: true })
}

export const onStats = async ctx => {
  const stats = await userService.getUserStats(ctx.from.id)
  return ctx.reply(
    `Статистика\n— Турниров: ${stats.totalTournaments}\n— Заявок: ${stats.totalApplications}`
  )
} 