import { Scenes } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'

export const adminTournamentsListScene = new Scenes.BaseScene('adminTournamentsList')

adminTournamentsListScene.enter(async ctx => {
  const isAdmin = await userService.isAdmin(ctx.from.id)
  if (!isAdmin) {
    await ctx.reply('Доступ только для администраторов')
    return ctx.scene.leave()
  }
  const tournaments = await tournamentAdminService.listTournaments()
  if (!tournaments.length) {
    await ctx.reply('Турниров пока нет')
    return ctx.scene.leave()
  }
  const lines = tournaments.slice(0, 20).map(t => `#${t.id} • ${t.name} • ${t.game} • ${t.status} • команды: ${t._count?.teams ?? '—'}`)
  await ctx.reply(['Список турниров:', ...lines].join('\n'))
  return ctx.scene.leave()
}) 