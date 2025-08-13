import { Scenes } from 'telegraf'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'
import { prisma } from '#prisma'
import { Markup } from 'telegraf'
import path from 'path'
import { fileURLToPath } from 'url'
import { MenuController } from '../../menu/menuController.js'
import { checkCommand } from '../utils/scene.utils.js'

const makeLabel = t => `#${t.id} — ${t.name} (${t.game})`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../../../../..')

export const adminAnnounceTournamentScene = new Scenes.WizardScene(
  'adminAnnounceTournament',
  async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) {
      await ctx.reply('Доступ только для администраторов')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }
    const tournaments = await tournamentAdminService.listTournaments({ status: 'OPEN' })
    if (!tournaments.length) {
      await ctx.reply('Нет открытых турниров для анонса')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }

    const labels = tournaments.slice(0, 20).map(makeLabel)
    ctx.wizard.state.openMap = Object.fromEntries(labels.map((label, idx) => [label, tournaments[idx].id]))

    await ctx.reply('Выберите турнир для анонса:', {
      reply_markup: Markup.keyboard(labels, { columns: 2 }).resize().reply_markup
    })

    return ctx.wizard.next()
  },
  checkCommand,
  async ctx => {
    const text = ctx.message?.text?.trim()
    const map = ctx.wizard.state.openMap || {}
    const id = map[text]
    if (!id) {
      await ctx.reply('Пожалуйста, выберите турнир кнопкой с клавиатуры:')
      return
    }

    const tournament = await tournamentAdminService.getTournamentById(id)
    if (!tournament) {
      await ctx.reply('Турнир не найден.')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }

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
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }

    const caption = [
      '🏆 НОВЫЙ ТУРНИР!',
      `Название: ${tournament.name}`,
      `Игра: ${tournament.game}`,
      tournament.prizePool ? `💰 Призовой фонд: ${tournament.prizePool}` : null,
      tournament.description ? `📝 Описание: ${tournament.description}` : null
    ].filter(Boolean).join('\n')

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📝 Подать заявку', `t_apply:${tournament.id}`)],
      [Markup.button.callback('🙈 Игнорировать', `t_ignore:${tournament.id}`)]
    ])

    let sent = 0
    for (const c of captains) {
      try {
        if (tournament.image?.relativePath) {
          const absolute = path.resolve(projectRoot, tournament.image.relativePath)
          await ctx.telegram.sendPhoto(String(c.telegramId), { source: absolute }, { caption, reply_markup: keyboard.reply_markup })
        } else {
          await ctx.telegram.sendMessage(String(c.telegramId), caption, { reply_markup: keyboard.reply_markup })
        }
        sent += 1
      } catch {}
    }

    await ctx.reply(`Анонс отправлен ${sent} капитанам`, Markup.removeKeyboard())
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }
) 