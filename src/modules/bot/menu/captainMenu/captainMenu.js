import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getManageTeamMenu = () => {
  const menu = [
    buttons.TEAM_VIEW,
    buttons.TEAM_INVITE,
    buttons.TEAM_REMOVE,
    buttons.TEAM_UPDATE,
    buttons.TEAM_INVITATIONS,
    buttons.TEAM_STATS,
    buttons.TEAM_APPLY,
    buttons.TEAM_APPS,
    buttons.TEAM_TOURNAMENTS,
    buttons.BACK
  ]
  return Markup.keyboard(menu, { columns: 2 }).resize()
}
