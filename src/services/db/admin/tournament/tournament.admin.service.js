import { prisma } from '../../prisma.js'

class TournamentAdminService {
  async createTournament(payload) {
    const data = {
      name: payload.name,
      description: payload.description ?? null,
      prizePool: payload.prizePool ?? null,
      maxTeams: payload.maxTeams,
      game: payload.game ?? 'MLBB',
      status: 'OPEN'
    }
    const tournament = await prisma.tournament.create({ data })
    return tournament
  }

  async listTournaments({ status } = {}) {
    const where = status ? { status } : {}
    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { teams: true, applications: true }
        }
      }
    })
    return tournaments
  }

  async getTournamentById(id) {
    return prisma.tournament.findUnique({ where: { id } })
  }

  async updateTournament(id, data) {
    return prisma.tournament.update({ where: { id }, data })
  }

  async deleteTournament(id) {
    return prisma.tournament.delete({ where: { id } })
  }
}

export const tournamentAdminService = new TournamentAdminService() 