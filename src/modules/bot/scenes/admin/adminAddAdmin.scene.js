import { Scenes } from 'telegraf'
import userService from '#userService'
import { userAdminService } from '#adminService'
import { MenuController } from '../../menu/menuController.js'

export const adminAddAdminScene = new Scenes.WizardScene(
  'adminAddAdmin',
  async ctx => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) {
      await ctx.reply('Доступ только для администраторов')
      await MenuController.sendMenu(ctx)
      return ctx.scene.leave()
    }
    await ctx.reply('Введите Telegram ID или @username пользователя для назначения админом:')
    return ctx.wizard.next()
  },
  async ctx => {
    const raw = ctx.message?.text?.trim()
    if (!raw) {
      await ctx.reply('Введите Telegram ID или @username:')
      return
    }

    try {
      let target
      if (raw.startsWith('@')) {
        const username = raw.slice(1)
        target = await userService.getUserByTelegramId(ctx.from.id) // placeholder to get prisma quickly
        // proper lookup by username
        target = await userService.getUserByTelegramUsername(username)
        if (!target) throw new Error('Пользователь с таким username не найден')
        await userAdminService.addAdmin(ctx.from.id, target.telegramId.toString())
      } else {
        const id = BigInt(raw)
        await userAdminService.addAdmin(ctx.from.id, id.toString())
      }
      await ctx.reply('Пользователь назначен администратором')
    } catch (e) {
      await ctx.reply(`Ошибка: ${e.message || 'не удалось назначить администратора'}`)
    }
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }
) 