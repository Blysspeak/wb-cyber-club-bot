import { buttons } from '#buttons'
import { Markup } from 'telegraf'

export const getUserMenu = user => {
  const menu = [buttons.PROFILE, buttons.STATS]

  if (user.team) {
    menu.push(buttons.MY_TEAM)
  } else {
    menu.push(buttons.CREATE_TEAM, buttons.JOIN_TEAM)
  }

  menu.push(buttons.GAMES)

  if (user.role === 'CAPTAIN') {
    menu.push(buttons.MANAGE_TEAM)
  }

  if (user.role === 'ADMIN') {
    menu.push(buttons.MANAGE_TOURNAMENTS, buttons.MANAGE_USERS, buttons.OVERALL_STATS)
  }

  menu.push(buttons.HELP)

  return Markup.keyboard(menu, {
    columns: 2
  }).resize()
}
