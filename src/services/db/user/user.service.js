import {
  getUserByTelegramId,
  getUserStats,
  getAllUsers,
  getFreePlayers,
  getTeamMembers,
  isCaptain,
  isAdmin,
  getTeamInfoText,
  getUserByTelegramUsername
} from './user.read.js'
import { registerUser, updateUserProfile, leaveTeam, respondToInvitation } from './user.write.js'
import {
  createTeam,
  getUserTeam,
  updateTeam,
  invitePlayer,
  removePlayer,
  deleteTeam,
  getTeamInvitations,
  getTeamStats,
  getTeamComposition
} from './user.team.js'
import { applyForTournament, getTeamApplications, getActiveTournaments } from './user.tournament.js'
import { prisma } from '#prisma'

class UserAdminService {
  async listAdmins() {
    return prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } })
  }

  async addAdmin(requestorTelegramId, targetTelegramId) {
    const requester = await prisma.user.findUnique({ where: { telegramId: BigInt(requestorTelegramId) } })
    if (!requester || requester.role !== 'ADMIN') throw new Error('Нет прав')

    const target = await prisma.user.findUnique({ where: { telegramId: BigInt(targetTelegramId) } })
    if (!target) throw new Error('Пользователь не найден')
    if (target.role === 'ADMIN') return target

    const updated = await prisma.user.update({ where: { id: target.id }, data: { role: 'ADMIN' } })
    return updated
  }

  async removeAdmin(requestorTelegramId, targetTelegramId) {
    const requester = await prisma.user.findUnique({ where: { telegramId: BigInt(requestorTelegramId) } })
    if (!requester || requester.role !== 'ADMIN') throw new Error('Нет прав')

    const target = await prisma.user.findUnique({ where: { telegramId: BigInt(targetTelegramId) } })
    if (!target) throw new Error('Пользователь не найден')

    if (requester.id === target.id) throw new Error('Нельзя удалить себя из администраторов')
    if (target.role !== 'ADMIN') throw new Error('Пользователь не является администратором')

    const updated = await prisma.user.update({ where: { id: target.id }, data: { role: 'PLAYER' } })
    return updated
  }
}

export const userAdminService = new UserAdminService()

class UserService {
  // user
  registerUser = registerUser
  getUserByTelegramId = getUserByTelegramId
  getUserByTelegramUsername = getUserByTelegramUsername
  updateUserProfile = updateUserProfile
  getUserStats = getUserStats
  leaveTeam = leaveTeam
  respondToInvitation = respondToInvitation
  getAllUsers = getAllUsers
  getFreePlayers = getFreePlayers
  getTeamMembers = getTeamMembers
  isCaptain = isCaptain
  isAdmin = isAdmin
  getTeamInfoText = getTeamInfoText

  // team
  createTeam = createTeam
  getUserTeam = getUserTeam
  updateTeam = updateTeam
  invitePlayer = invitePlayer
  removePlayer = removePlayer
  deleteTeam = deleteTeam
  getTeamInvitations = getTeamInvitations
  getTeamStats = getTeamStats
  getTeamComposition = getTeamComposition

  // tournaments
  applyForTournament = applyForTournament
  getTeamApplications = getTeamApplications
  getActiveTournaments = getActiveTournaments
}

export default new UserService() 