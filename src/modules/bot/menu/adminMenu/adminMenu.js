import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getAdminMenu = () => {
  const menu = [
    buttons.ADMIN_TOURNAMENT_SETTINGS,
    buttons.ADMIN_USER_MANAGEMENT,
    buttons.MAIN_MENU
  ]

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
