import { buttons } from '#buttons'
import { Markup } from 'telegraf'
import { SUPERADMIN_IDS } from '#utils'

const superSet = new Set(
  String(SUPERADMIN_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

export const getUserMenu = user => {
  const menu = [buttons.PROFILE, buttons.STATS]

  if (user.team) {
    menu.push(buttons.MY_TEAM)
  } else {
    menu.push(buttons.CREATE_TEAM, buttons.JOIN_TEAM)
  }

  menu.push(buttons.GAMES)


  menu.push(buttons.HELP)

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
