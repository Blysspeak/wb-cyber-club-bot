import { createBot } from './botInit.js'
import { MenuController } from './menu/menuController.js'
import { buttons } from '#buttons'
import { onProfile, onStats } from './handlers/profile.handlers.js'
import { onMyTeam, onTeamOverview, onTeamManage, onTeamSettings, sendTeamRosterRich, onCreateTeam, onJoinTeamGuarded } from './handlers/team.handlers.js'
import { onGames } from './handlers/games.handlers.js'
import { logger } from '#utils'
import { registerInvitationActions } from './handlers/invitation.handlers.js'

export const setupBot = () => {
  const bot = createBot()

  if (!bot) {
    return null
  }

  const safeHears = (trigger, handler) => {
    const isValidTrigger =
      typeof trigger === 'string' ||
      trigger instanceof RegExp ||
      typeof trigger === 'function' ||
      (Array.isArray(trigger) && trigger.every(t => typeof t === 'string' || t instanceof RegExp || typeof t === 'function'))

    if (!isValidTrigger) {
      logger.error('Invalid trigger passed to hears', { trigger })
      return
    }
    bot.hears(trigger, handler)
  }

  bot.command('menu', MenuController.sendMenu)

  // User Menu
  bot.hears(buttons.PROFILE, onProfile)
  bot.hears(buttons.STATS, onStats)
  bot.hears(buttons.MY_TEAM, onMyTeam)
  bot.hears(buttons.CREATE_TEAM, async ctx => onCreateTeam(ctx))
  bot.hears(buttons.JOIN_TEAM, onJoinTeamGuarded)
  bot.hears(buttons.GAMES, onGames)
  bot.hears(buttons.HELP, ctx => ctx.reply('Помощь — скоро'))

  // Team nested menus
  safeHears(buttons.TEAM_VIEW, async ctx => {
    await sendTeamRosterRich(ctx)
    return onTeamOverview(ctx)
  })
  safeHears(buttons.TEAM_MANAGE, onTeamManage)
  safeHears(buttons.TEAM_SETTINGS, onTeamSettings)
  safeHears(buttons.TEAM_INVITE, ctx => ctx.scene.enter('invitePlayer'))
  safeHears(buttons.TEAM_REMOVE, ctx => ctx.scene.enter('removePlayer'))
  safeHears(buttons.TEAM_DELETE, ctx => ctx.reply('Удаление команды — скоро'))
  safeHears(buttons.TEAM_UPDATE, ctx => ctx.scene.enter('updateTeam'))
  safeHears(buttons.TEAM_INVITATIONS, ctx => ctx.reply('Приглашения — скоро'))
  safeHears(buttons.TEAM_STATS, ctx => ctx.reply('Статистика команды — скоро'))
  safeHears(buttons.TEAM_APPLY, ctx => ctx.reply('Заявка на турнир — скоро'))
  safeHears(buttons.TEAM_APPS, ctx => ctx.reply('Заявки команды — скоро'))
  safeHears(buttons.TEAM_TOURNAMENTS, ctx => ctx.reply('Активные турниры — скоро'))

  // Invite callbacks
  registerInvitationActions(bot)

  // Contextual Back
  bot.hears(buttons.BACK, async ctx => {
    const state = ctx.session?.menuState
    if (state === 'TEAM_MANAGE' || state === 'TEAM_SETTINGS') {
      return onTeamOverview(ctx)
    }
    return MenuController.sendMenu(ctx)
  })

  // Admin Menu
  bot.hears(buttons.MANAGE_TOURNAMENTS, ctx => ctx.reply('Управление турнинами — скоро'))
  bot.hears(buttons.MANAGE_USERS, ctx => ctx.reply('Управление пользователями — скоро'))
  bot.hears(buttons.OVERALL_STATS, ctx => ctx.reply('Общая статистика — скоро'))
  bot.hears(buttons.MAIN_MENU, MenuController.sendMenu)

  return bot
}
