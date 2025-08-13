import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getAdminMenu = () => {
  const menu = [
    buttons.ADMIN_TOURNAMENT_SETTINGS,
    buttons.ADMIN_USER_MANAGEMENT,
    buttons.EXIT_TO_USER_MENU
  ]

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
