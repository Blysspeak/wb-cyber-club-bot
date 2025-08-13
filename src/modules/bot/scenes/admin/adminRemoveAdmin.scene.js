import { Scenes } from 'telegraf'
import userService from '#userService'
import { userAdminService } from '#adminService'

export const adminRemoveAdminScene = new Scenes.WizardScene(
  'adminRemoveAdmin',
  async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) {
      await ctx.reply('Доступ только для администраторов')
      return ctx.scene.leave()
    }
    await ctx.reply('Введите Telegram ID или @username администратора для удаления:')
    return ctx.wizard.next()
  },
  async ctx => {
    const raw = ctx.message?.text?.trim()
    if (!raw) {
      await ctx.reply('Введите Telegram ID или @username:')
      return
    }

    try {
      if (raw.startsWith('@')) {
        const username = raw.slice(1)
        const target = await userService.getUserByTelegramUsername(username)
        if (!target) throw new Error('Пользователь с таким username не найден')
        await userAdminService.removeAdmin(ctx.from.id, target.telegramId.toString())
      } else {
        const id = BigInt(raw)
        await userAdminService.removeAdmin(ctx.from.id, id.toString())
      }
      await ctx.reply('Администратор удален')
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message || 'не удалось удалить администратора'}`)
    }
    return ctx.scene.leave()
  }
) 