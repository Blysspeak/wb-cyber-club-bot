import { tournamentAdminService } from '#adminService'
import userService from '#userService'

export const registerAdminModerationActions = bot => {
  bot.action(/^app_approve:(\d+)$/, async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) return ctx.answerCbQuery('Нет прав', { show_alert: true })
    const id = Number(ctx.match[1])
    try {
      const app = await tournamentAdminService.approveApplication(id)
      await ctx.answerCbQuery('Одобрено')
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {})
      await ctx.reply(`✅ Заявка одобрена: команда ${app.team.name} в турнире ${app.tournament.name}`)
    } catch (e) {
      await ctx.answerCbQuery('Ошибка', { show_alert: true })
    }
  })

  bot.action(/^app_reject:(\d+)$/, async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) return ctx.answerCbQuery('Нет прав', { show_alert: true })
    const id = Number(ctx.match[1])
    ctx.session.__rejectAppId = id
    await ctx.answerCbQuery()
    await ctx.reply('Укажите причину отклонения одной строкой:')
  })

  bot.on('text', async (ctx, next) => {
    if (!ctx.session || !ctx.session.__rejectAppId) return next()
    const pendingId = ctx.session.__rejectAppId
    const reason = ctx.message.text?.trim()
    if (!reason) return
    delete ctx.session.__rejectAppId

    try {
      const app = await tournamentAdminService.rejectApplication(pendingId, reason)
      await ctx.reply(`❌ Заявка отклонена: команда ${app.team.name} в турнире ${app.tournament.name}\nПричина: ${reason}`)

      // Notify captain
      const captainId = app.team?.captainId
      if (captainId) {
        const captain = await userService.getUserById(captainId)
        if (captain?.telegramId) {
          const notifyText = [
            `❌ Ваша заявка отклонена`,
            `Команда: ${app.team.name}`,
            `Турнир: ${app.tournament.name}`,
            `Причина: ${reason}`
          ].join('\n')
          await ctx.telegram.sendMessage(String(captain.telegramId), notifyText)
        }
      }
    } catch (e) {
      await ctx.reply('Ошибка отклонения заявки')
    }
  })
} 