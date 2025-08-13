import { Scenes } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'
import { MenuController } from '../../menu/menuController.js'

export const adminTournamentsListScene = new Scenes.BaseScene('adminTournamentsList')

adminTournamentsListScene.enter(async ctx => {
  const isAdmin = await userService.isAdmin(ctx.from.id)
  if (!isAdmin) {
    await ctx.reply('Доступ только для администраторов')
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }
  const tournaments = await tournamentAdminService.listTournaments()
  if (!tournaments.length) {
    await ctx.reply('Турниров пока нет')
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }
  const base = `${ctx?.request?.protocol || 'http'}://${ctx?.request?.host || 'localhost'}` // may be undefined in TG context, so omit
  const lines = tournaments.slice(0, 20).map(t => {
    const img = t.image?.relativePath ? `/` + t.image.relativePath.replace(/\\/g, '/') : ''
    return `#${t.id} • ${t.name} • ${t.game} • ${t.status} • команды: ${t._count?.teams ?? '—'}${img ? `\nИзображение: ${img}` : ''}`
  })
  await ctx.reply(['Список турниров:', ...lines].join('\n\n'))
  await MenuController.sendMenu(ctx)
  return ctx.scene.leave()
}) 