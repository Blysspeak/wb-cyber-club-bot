import { buttons } from '../../menu/buttons.js'
import { MenuController } from '../../menu/menuController.js'

export const checkCommand = async (ctx, next) => {
  const text = ctx.message?.text?.trim()
  const isCommand = Object.values(buttons).includes(text)

  if (isCommand) {
    await ctx.reply('Действие прервано. Вы вернулись в главное меню.')
    await MenuController.sendMenu(ctx)
    return ctx.scene.leave()
  }

  return next()
} 