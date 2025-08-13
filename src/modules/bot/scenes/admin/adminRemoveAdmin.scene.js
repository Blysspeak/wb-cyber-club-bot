import { Scenes } from 'telegraf'
import { z } from 'zod'
import userService from '#userService'
import { userAdminService } from '#adminService'
import { MenuController } from '../../menu/menuController.js'
import { checkCommand } from '../utils/scene.utils.js'

const adminInputSchema = z.string().min(1)

export const adminRemoveAdminScene = new Scenes.WizardScene(
  'adminRemoveAdmin',
  async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) {
      await ctx.reply('Доступ только для администраторов')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }
    await ctx.reply('Введите Telegram ID или @username администратора для удаления:')
    return ctx.wizard.next()
  },
  checkCommand,
  async ctx => {
    const raw = ctx.message?.text?.trim()
    const parsed = adminInputSchema.safeParse(raw)

    if (!parsed.success) {
      await ctx.reply('Введите Telegram ID или @username:')
      return
    }

    const input = parsed.data

    try {
      if (input.startsWith('@')) {
        const username = input.slice(1)
        const target = await userService.getUserByTelegramUsername(username)
        if (!target) throw new Error('Пользователь с таким username не найден')
        await userAdminService.removeAdmin(ctx.from.id, target.telegramId.toString())
      } else {
        const id = BigInt(input)
        await userAdminService.removeAdmin(ctx.from.id, id.toString())
      }
      await ctx.reply('Администратор удален')
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message || 'не удалось удалить администратора'}`)
    }
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }
) 