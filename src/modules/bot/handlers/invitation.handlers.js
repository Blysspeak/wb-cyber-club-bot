import userService from '#userService'
import redis from '#cache'
import { MenuController } from '../menu/menuController.js'
import { Telegraf } from 'telegraf'
import { applyForTournament } from '#userService'
import { logger } from '#utils'
import { prisma } from '#prisma'

export const registerInvitationActions = bot => {
  bot.action(/^invite:(accept|decline):(\d+)$/, async ctx => {
    try {
      const [, action, idStr] = ctx.match
      const invitationId = Number(idStr)
      const metaStr = await redis.get(`invite:${invitationId}`)
      const response = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
      await userService.respondToInvitation(ctx.from.id, invitationId, response)

      if (response === 'ACCEPTED') {
        await ctx.answerCbQuery('Вы вступили в команду')
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {})
        await ctx.editMessageText('✅ Вы приняли приглашение и вступили в команду').catch(() => {})
        // Refresh main menu to reflect team membership
        await MenuController.sendMenu(ctx)
      } else {
        await ctx.answerCbQuery('Вы отклонили приглашение')
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {})
        await ctx.editMessageText('❌ Вы отклонили приглашение в команду').catch(() => {})
      }

      if (metaStr) {
        const meta = JSON.parse(metaStr)
        try {
          const text = response === 'ACCEPTED'
            ? 'Игрок принял приглашение'
            : 'Игрок отклонил приглашение'
          await ctx.telegram.sendMessage(Number(meta.createdByTelegramId), `${text}: ${ctx.from.first_name}`)
        } catch {}
      }
    } catch (e) {
      await ctx.answerCbQuery('Ошибка обработки приглашения', { show_alert: true }).catch(() => {})
    }
  })

  bot.action(/^t_apply:(\d+)$/, async ctx => {
    const id = Number(ctx.match[1])
    try {
      const app = await applyForTournament(ctx.from.id, id)
      await ctx.answerCbQuery('Заявка отправлена')
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      const tournamentName = app.tournament?.name || `#${id}`
      await ctx.reply(`Заявка на турнир ${tournamentName} отправлена. Ожидайте решение администрации.`)

      // Notify all admins about the new application
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { telegramId: true } })
        const teamName = app.team?.name || '—'
        const captain = app.team?.captain
        const captainLine = captain
          ? `${captain.nickname || captain.name || captain.telegramUsername || captain.id}`
          : '-'
        const notifyText = [
          '📝 Новая заявка на турнир',
          `Турнир: ${tournamentName}`,
          `Команда: ${teamName}`,
          `Капитан: ${captainLine}`
        ].join('\n')
        for (const a of admins) {
          try {
            await ctx.telegram.sendMessage(String(a.telegramId), notifyText)
          } catch {}
        }
      } catch (e) {
        logger.warn('Failed to notify admins about application', e)
      }
    } catch (e) {
      await ctx.answerCbQuery('Не удалось отправить заявку', { show_alert: true })
      await ctx.reply(`Ошибка: ${e.message || 'не удалось отправить заявку'}`)
    }
  })

  bot.action(/^t_ignore:(\d+)$/, async ctx => {
    try {
      await ctx.answerCbQuery('Окей, скрываю')
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
    } catch (e) {
      logger.warn('Ignore click failed', e)
    }
  })
} 