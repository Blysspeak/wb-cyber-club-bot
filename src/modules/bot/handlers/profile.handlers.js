import userService from '#userService'

export const onProfile = async ctx => {
  const user = await userService.getUserByTelegramId(ctx.from.id)
  if (!user) return ctx.reply('Вы не зарегистрированы. Введите /start')

  if (user.games?.includes('MLBB') && (!user.mlbbId || !user.mlbbServer)) {
    await ctx.reply('Нужно заполнить MLBB ID и сервер')
    return ctx.scene.enter('mlbb')
  }

  const games = user.games?.length ? user.games.join(', ') : '-'
  const mlbb = user.games?.includes('MLBB')
    ? `\nMLBB: ID=${user.mlbbId} | Сервер=${user.mlbbServer}`
    : ''
  return ctx.reply(
    `Профиль\n— Имя: ${user.name}\n— Ник: ${user.nickname}\n— Роль: ${user.role}\n— Игры: ${games}${mlbb}`
  )
}

export const onStats = async ctx => {
  const stats = await userService.getUserStats(ctx.from.id)
  return ctx.reply(
    `Статистика\n— Турниров: ${stats.totalTournaments}\n— Заявок: ${stats.totalApplications}`
  )
} 