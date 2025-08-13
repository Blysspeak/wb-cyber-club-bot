import userService from '#userService'
import redis from '#cache'
import { MenuController } from '../menu/menuController.js'
import { Telegraf } from 'telegraf'
import { applyForTournament } from '#userService'
import { logger } from '#utils'

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
      await ctx.reply(`Заявка на турнир #${id} отправлена. Статус: PENDING`)
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