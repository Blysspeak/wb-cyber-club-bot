import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getUsersMenu = () => {
  const menu = [
    buttons.ADMIN_ADD_ADMIN,
    buttons.ADMIN_REMOVE_ADMIN,
    buttons.MANAGE_USERS,
    buttons.OVERALL_STATS,
    buttons.BACK
  ]

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
} 