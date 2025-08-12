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