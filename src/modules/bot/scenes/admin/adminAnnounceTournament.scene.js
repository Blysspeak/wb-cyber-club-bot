import { Scenes } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'
import { prisma } from '../../../../services/db/prisma.js'

export const adminAnnounceTournamentScene = new Scenes.WizardScene(
  'adminAnnounceTournament',
  async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) {
      await ctx.reply('Доступ только для администраторов')
      return ctx.scene.leave()
    }
    const tournaments = await tournamentAdminService.listTournaments({ status: 'OPEN' })
    if (!tournaments.length) {
      await ctx.reply('Нет открытых турниров для анонса')
      return ctx.scene.leave()
    }
    const lines = tournaments.slice(0, 20).map(t => `#${t.id} — ${t.name} (${t.game})`)
    await ctx.reply(['Выберите турнир для анонса. Введите ID:', ...lines].join('\n'))
    return ctx.wizard.next()
  },
  async ctx => {
    const raw = ctx.message?.text?.trim()
    const id = Number(raw)
    if (!Number.isInteger(id) || id <= 0) {
      await ctx.reply('Введите корректный числовой ID турнира:')
      return
    }
    const tournament = await tournamentAdminService.getTournamentById(id)
    if (!tournament) {
      await ctx.reply('Турнир не найден. Введите другой ID:')
      return
    }

    // Find all captains with the same game in their games list
    const captains = await prisma.user.findMany({
      where: {
        role: 'CAPTAIN',
        games: { has: tournament.game }
      },
      select: {
        telegramId: true,
        telegramUsername: true,
        name: true,
        nickname: true
      }
    })

    if (!captains.length) {
      await ctx.reply('Капитаны для анонса не найдены.')
      return ctx.scene.leave()
    }

    const message = [
      '🏆 НОВЫЙ ТУРНИР!',
      `Название: ${tournament.name}`,
      `Игра: ${tournament.game}`,
      tournament.prizePool ? `💰 Призовой фонд: ${tournament.prizePool}` : null,
      tournament.description ? `📝 Описание: ${tournament.description}` : null
    ].filter(Boolean).join('\n')

    for (const c of captains) {
      try {
        await ctx.telegram.sendMessage(String(c.telegramId), message)
      } catch {}
    }
    await ctx.reply(`Анонс отправлен ${captains.length} капитанам`)
    return ctx.scene.leave()
  }
) 