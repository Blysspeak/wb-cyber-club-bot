import { Scenes, Markup } from 'telegraf'
import userService from '#userService'
import redis from '#cache'

const ask = (ctx, text) => ctx.reply(text)

const INVITE_TTL_SEC = 60 * 60 * 6 // 6 hours

export const invitePlayerScene = new Scenes.WizardScene(
  'invitePlayer',
  async ctx => {
    const me = await userService.getUserByTelegramId(ctx.from.id)
    if (!me || me.role !== 'CAPTAIN') {
      await ctx.reply('Доступно только для капитанов команды')
      return ctx.scene.leave()
    }
    await ask(ctx, 'Введи Telegram ID или @username игрока:')
    return ctx.wizard.next()
  },
  async ctx => {
    const raw = ctx.message?.text?.trim()
    if (!raw) return ask(ctx, 'Укажи корректный ID или @username:')

    let target = null
    if (/^\d{6,}$/.test(raw)) {
      target = await userService.getUserByTelegramId(raw)
    } else {
      target = await userService.getUserByTelegramUsername(raw)
    }

    if (!target) {
      await ctx.reply('Пользователь не найден. Пригласить можно только зарегистрированных игроков.')
      return ctx.scene.leave()
    }
    if (String(target.telegramId) === String(ctx.from.id)) {
      await ctx.reply('Нельзя пригласить самого себя')
      return ctx.scene.leave()
    }

    try {
      const invitation = await userService.invitePlayer(ctx.from.id, target.telegramId)

      // Cache invite metadata for quick access by callback handlers
      const inviteKey = `invite:${invitation.id}`
      const meta = {
        invitationId: invitation.id,
        teamId: invitation.teamId,
        invitedUserId: target.id,
        invitedTelegramId: String(target.telegramId),
        createdByTelegramId: String(ctx.from.id)
      }
      await redis.set(inviteKey, JSON.stringify(meta), 'EX', INVITE_TTL_SEC)

      const captain = await userService.getUserByTelegramId(ctx.from.id)
      const team = await userService.getUserTeam(ctx.from.id)

      const caption = [
        `Вас приглашают в команду: ${team.name} (${team.acronym})`,
        `Капитан: ${captain.nickname || captain.name || captain.telegramUsername || captain.id}`
      ].join('\n')

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Вступить', `invite:accept:${invitation.id}`),
          Markup.button.callback('❌ Отклонить', `invite:decline:${invitation.id}`)
        ]
      ])

      if (team.logo) {
        await ctx.telegram.sendPhoto(Number(target.telegramId), team.logo, { caption, ...keyboard })
      } else {
        await ctx.telegram.sendMessage(Number(target.telegramId), caption, keyboard)
      }

      await ctx.reply('Приглашение отправлено')
      return ctx.scene.leave()
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message}`)
      return ctx.scene.leave()
    }
  }
) 