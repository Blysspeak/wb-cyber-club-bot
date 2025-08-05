import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getAdminMenu = () => {
  const menu = [
    buttons.MANAGE_TOURNAMENTS,
    buttons.MANAGE_USERS,
    buttons.OVERALL_STATS,
    buttons.MAIN_MENU
  ]

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
