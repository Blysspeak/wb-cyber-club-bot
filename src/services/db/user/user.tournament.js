import { prisma } from '../prisma.js'
import { getUserTeam } from './user.team.js'
import { cacheDel } from '#cache'

export const applyForTournament = async (telegramId, tournamentId) => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
  if (!tournament) throw new Error('Турнир не найден')
  if (tournament.status !== 'OPEN') throw new Error('Турнир закрыт для заявок')

  const existingApplication = await prisma.tournamentApplication.findFirst({ where: { tournamentId, teamId: captainTeam.id } })
  if (existingApplication) throw new Error('Заявка на этот турнир уже подана')

  if (captainTeam.members.length < 5) throw new Error('В команде должно быть минимум 5 игроков для участия в турнире')

  const app = await prisma.tournamentApplication.create({
    data: { tournamentId, teamId: captainTeam.id, status: 'PENDING' },
    include: { tournament: true, team: { include: { captain: true, members: true } } }
  })

  await cacheDel(['team', 'byUserTg', String(telegramId)])
  return app
}

export const getTeamApplications = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  return prisma.tournamentApplication.findMany({
    where: { teamId: captainTeam.id },
    include: { tournament: true },
    orderBy: { createdAt: 'desc' }
  })
}

export const getActiveTournaments = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  return prisma.tournament.findMany({ where: { status: 'OPEN', game: 'MLBB' }, orderBy: { createdAt: 'desc' } })
} 