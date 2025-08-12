import userService from '#userService'
import { MenuController } from '../menu/menuController.js'

export const onMyTeam = async ctx => {
  try {
    const text = await userService.getTeamInfoText(ctx.from.id)
    await ctx.reply(text)
    await MenuController.sendTeamOverviewMenu(ctx)
  } catch (e) {
    await ctx.reply(e.message)
  }
}

export const onTeamOverview = async ctx => MenuController.sendTeamOverviewMenu(ctx)
export const onTeamManage = async ctx => MenuController.sendTeamManageMenu(ctx)
export const onTeamSettings = async ctx => MenuController.sendTeamSettingsMenu(ctx) 