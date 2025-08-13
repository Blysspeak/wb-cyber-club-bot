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

  async createTournamentWithImage(payload, imageMeta) {
    return prisma.$transaction(async tx => {
      const image = await tx.image.create({
        data: {
          uuid: imageMeta.uuid,
          relativePath: imageMeta.relativePath,
          mimeType: imageMeta.mimeType || null,
          size: imageMeta.size || null,
          category: 'admin',
          type: 'tournament'
        }
      })
      const tournament = await tx.tournament.create({
        data: {
          name: payload.name,
          description: payload.description ?? null,
          prizePool: payload.prizePool ?? null,
          maxTeams: payload.maxTeams,
          game: payload.game ?? 'MLBB',
          status: 'OPEN',
          imageId: image.id
        }
      })
      return { tournament, image }
    })
  }

  async listTournaments({ status } = {}) {
    const where = status ? { status } : {}
    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { teams: true, applications: true }
        },
        image: true
      }
    })
    return tournaments
  }

  async getTournamentById(id) {
    return prisma.tournament.findUnique({ where: { id }, include: { image: true } })
  }

  async updateTournament(id, data) {
    return prisma.tournament.update({ where: { id }, data })
  }

  async deleteTournament(id) {
    return prisma.tournament.delete({ where: { id } })
  }

  async getPendingApplications() {
    return prisma.tournamentApplication.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        tournament: true,
        team: {
          include: {
            captain: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true, wildberriesId: true, mlbbId: true, mlbbServer: true } },
            members: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true, wildberriesId: true, mlbbId: true, mlbbServer: true } }
          }
        }
      }
    })
  }

  async approveApplication(applicationId) {
    return prisma.$transaction(async tx => {
      const app = await tx.tournamentApplication.update({ where: { id: applicationId }, data: { status: 'APPROVED' }, include: { tournament: true, team: true } })
      await tx.teamTournament.create({ data: { teamId: app.teamId, tournamentId: app.tournamentId } })
      return app
    })
  }

  async rejectApplication(applicationId, reason) {
    return prisma.tournamentApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED', rejectionReason: reason }, include: { tournament: true, team: true } })
  }
}

export const tournamentAdminService = new TournamentAdminService() 