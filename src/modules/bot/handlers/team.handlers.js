import userService from '#userService'
import { MenuController } from '../menu/menuController.js'

export const onMyTeam = async ctx => {
  try {
    const text = await userService.getTeamInfoText(ctx.from.id)
    await ctx.reply(text)
    const user = await userService.getUserByTelegramId(ctx.from.id)
    if (user?.role === 'CAPTAIN') {
      await MenuController.sendManageTeamMenu(ctx)
    }
  } catch (e) {
    await ctx.reply(e.message)
  }
}

export const onManageTeam = async ctx => MenuController.sendManageTeamMenu(ctx) 