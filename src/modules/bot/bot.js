import { createBot } from './botInit.js'
import { MenuController } from './menu/menuController.js'
import { buttons } from '#buttons'
import { onProfile, onStats } from './handlers/profile.handlers.js'
import { onMyTeam, onTeamOverview, onTeamManage, onTeamSettings, sendTeamRosterRich, onCreateTeam, onJoinTeamGuarded } from './handlers/team.handlers.js'
import { onGames } from './handlers/games.handlers.js'
import { logger } from '#utils'
import { registerInvitationActions } from './handlers/invitation.handlers.js'
import { userAdminService } from '#adminService'
import userService from '#userService'
import { registerAdminModerationActions } from './handlers/admin.handlers.js'

export const setupBot = () => {
  const bot = createBot()

  if (!bot) {
    return null
  }

  bot.command('menu', MenuController.sendMenu)
  bot.command('admin', MenuController.sendAdminMenu)

  // User Menu
  bot.hears(buttons.PROFILE, onProfile)
  bot.hears(buttons.STATS, onStats)
  bot.hears(buttons.MY_TEAM, onMyTeam)
  bot.hears(buttons.CREATE_TEAM, async ctx => onCreateTeam(ctx))
  bot.hears(buttons.JOIN_TEAM, onJoinTeamGuarded)
  bot.hears(buttons.GAMES, onGames)
  bot.hears(buttons.HELP, ctx => ctx.reply('Помощь — скоро'))

  // Team nested menus
  bot.hears(buttons.TEAM_VIEW, async ctx => {
    await sendTeamRosterRich(ctx)
    return onTeamOverview(ctx)
  })
  bot.hears(buttons.TEAM_MANAGE, onTeamManage)
  bot.hears(buttons.TEAM_SETTINGS, onTeamSettings)
  bot.hears(buttons.TEAM_INVITE, ctx => ctx.scene.enter('invitePlayer'))
  bot.hears(buttons.TEAM_REMOVE, ctx => ctx.scene.enter('removePlayer'))
  bot.hears(buttons.TEAM_DELETE, ctx => ctx.reply('Удаление команды — скоро'))
  bot.hears(buttons.TEAM_UPDATE, ctx => ctx.scene.enter('updateTeam'))
  bot.hears(buttons.TEAM_INVITATIONS, ctx => ctx.reply('Приглашения — скоро'))
  bot.hears(buttons.TEAM_STATS, ctx => ctx.reply('Статистика команды — скоро'))
  bot.hears(buttons.TEAM_APPLY, ctx => ctx.reply('Заявка на турнир — скоро'))
  bot.hears(buttons.TEAM_APPS, ctx => ctx.reply('Заявки команды — скоро'))
  bot.hears(buttons.TEAM_TOURNAMENTS, ctx => ctx.reply('Активные турниры — скоро'))

  // Admin Menu
  bot.hears(buttons.ADMIN_TOURNAMENT_SETTINGS, async (ctx) => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) return ctx.reply('Доступ только для администраторов')
    return MenuController.sendTournamentsMenu(ctx)
  })

  bot.hears(buttons.ADMIN_USER_MANAGEMENT, async (ctx) => {
    const isAdmin = await userService.isAdmin(ctx.from.id)
    if (!isAdmin) return ctx.reply('Доступ только для администраторов')
    return MenuController.sendUsersMenu(ctx)
  })

  bot.hears(buttons.ADMIN_CREATE_TOURNAMENT, ctx => ctx.scene.enter('adminCreateTournament'))
  bot.hears(buttons.ADMIN_TOURNAMENTS_LIST, ctx => ctx.scene.enter('adminTournamentsList'))
  bot.hears(buttons.ADMIN_ANNOUNCE_TOURNAMENT, ctx => ctx.scene.enter('adminAnnounceTournament'))
  bot.hears(buttons.ADMIN_PENDING_APPS, ctx => ctx.scene.enter('adminPendingApplications'))
  bot.hears(buttons.ADMIN_ADD_ADMIN, ctx => ctx.scene.enter('adminAddAdmin'))
  bot.hears(buttons.ADMIN_REMOVE_ADMIN, ctx => ctx.scene.enter('adminRemoveAdmin'))

  bot.hears(buttons.MANAGE_USERS, ctx => ctx.reply('Управление пользователями — скоро'))
  bot.hears(buttons.OVERALL_STATS, ctx => ctx.reply('Общая статистика — скоро'))
  bot.hears(buttons.MAIN_MENU, MenuController.sendMenu)

  // Back button
  bot.hears(buttons.BACK, async ctx => {
    const user = await userService.getUserByTelegramId(ctx.from.id)
    const state = ctx.session?.menuState
    if (user?.role === 'ADMIN' || user?.isSuper) {
        if (state === 'ADMIN_TOURNAMENTS' || state === 'ADMIN_USERS') {
            return MenuController.sendAdminMenu(ctx)
        }
        return MenuController.sendAdminMenu(ctx)
    }
    if (state === 'TEAM_MANAGE' || state === 'TEAM_SETTINGS') {
      return onTeamOverview(ctx)
    }
    return MenuController.sendMenu(ctx)
  })

  // Invite callbacks
  registerInvitationActions(bot)
  registerAdminModerationActions(bot)

  return bot
}
