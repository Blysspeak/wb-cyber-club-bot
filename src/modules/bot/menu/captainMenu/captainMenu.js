import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getTeamOverviewMenu = (isCaptain = false) => {
  const menu = [
    buttons.TEAM_VIEW,
  ]
  if (isCaptain) {
    menu.push(buttons.TEAM_MANAGE, buttons.TEAM_SETTINGS)
  }
  menu.push(buttons.BACK)
  return Markup.keyboard(menu, { columns: 2 }).resize()
}

export const getTeamManageMenu = () => {
  const menu = [
    buttons.TEAM_INVITE,
    buttons.TEAM_REMOVE,
    buttons.BACK
  ]
  return Markup.keyboard(menu, { columns: 2 }).resize()
}

export const getTeamSettingsMenu = () => {
  const menu = [
    buttons.TEAM_DELETE,
    buttons.BACK
  ]
  return Markup.keyboard(menu, { columns: 2 }).resize()
}
