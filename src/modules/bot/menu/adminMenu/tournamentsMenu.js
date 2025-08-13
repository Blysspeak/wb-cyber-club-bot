import { Markup } from 'telegraf'
import { buttons } from '#buttons'

export const getTournamentsMenu = () => {
  const menu = [
    buttons.ADMIN_CREATE_TOURNAMENT,
    buttons.ADMIN_TOURNAMENTS_LIST,
    buttons.ADMIN_ANNOUNCE_TOURNAMENT,
    buttons.ADMIN_PENDING_APPS,
    buttons.BACK
  ]

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
} 