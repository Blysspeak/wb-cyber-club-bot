import { Markup } from 'telegraf'
import { buttons } from './buttons.js'

export const getCaptainMenu = () => {
  const menu = [
    buttons.PROFILE,
    buttons.STATS,
    buttons.MANAGE_TEAM,
    buttons.MY_TOURNAMENTS,
    buttons.HELP
  ]
  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
