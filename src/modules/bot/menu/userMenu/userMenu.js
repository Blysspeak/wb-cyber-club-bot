import { buttons } from '#buttons'
import { Markup } from 'telegraf'

export const getUserMenu = user => {
  const menu = [buttons.PROFILE, buttons.STATS]

  if (user.team) {
    menu.push(buttons.MY_TEAM)
  } else {
    menu.push(buttons.CREATE_TEAM, buttons.JOIN_TEAM)
  }
  menu.push(buttons.HELP)

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
