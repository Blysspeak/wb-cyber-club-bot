import { prisma } from '#prisma'

class UserService {
  async registerUser(userData) {
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(userData.telegramId) }
    })

    if (existingUser) {
      throw new Error('Пользователь уже зарегистрирован')
    }

    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(userData.telegramId),
        telegramUsername: userData.telegramUsername || null,
        wildberriesId: userData.wildberriesId,
        name: userData.name,
        nickname: userData.nickname,
        discord: userData.discord || null,
        birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
        role: 'PLAYER'
      }
    })

    return user
  }

  async getUserByTelegramId(telegramId) {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        team: {
          include: {
            captain: {
              select: {
                id: true,
                telegramId: true,
                telegramUsername: true,
                name: true,
                nickname: true
              }
            }
          }
        }
      }
    })

    return user
  }

  async updateUserProfile(telegramId, updateData) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    if (updateData.wildberriesId && updateData.wildberriesId !== user.wildberriesId) {
      const existingUserByWb = await prisma.user.findFirst({
        where: {
          wildberriesId: updateData.wildberriesId,
          NOT: { id: user.id }
        }
      })

      if (existingUserByWb) {
        throw new Error('Wildberries ID уже используется другим пользователем')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: {
        wildberriesId: updateData.wildberriesId ?? undefined,
        name: updateData.name ?? undefined,
        nickname: updateData.nickname ?? undefined,
        discord: updateData.discord ?? undefined,
        birthDate: updateData.birthDate ? new Date(updateData.birthDate) : undefined,
        games: updateData.games ?? undefined
      },
      include: { team: true }
    })

    return updatedUser
  }

  async getUserStats(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    const tournamentStats = await prisma.teamTournament.count({
      where: {
        team: {
          members: {
            some: { telegramId: BigInt(telegramId) }
          }
        }
      }
    })

    const applicationStats = await prisma.tournamentApplication.count({
      where: {
        team: {
          members: {
            some: { telegramId: BigInt(telegramId) }
          }
        }
      }
    })

    return {
      totalTournaments: tournamentStats,
      totalApplications: applicationStats,
      role: user.role,
      team: user.team
        ? { id: user.team.id, name: user.team.name, acronym: user.team.acronym }
        : null
    }
  }

  async leaveTeam(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    if (!user.teamId) {
      throw new Error('Вы не состоите в команде')
    }

    const team = await prisma.team.findUnique({ where: { id: user.teamId } })

    if (team && team.captainId === user.id) {
      throw new Error(
        'Капитан не может покинуть команду. Сначала удалите команду или передайте капитанство.'
      )
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { teamId: null, role: 'PLAYER' }
    })

    return updatedUser
  }

  async getInvitations(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    const invitations = await prisma.invitation.findMany({
      where: { userId: user.id, status: 'PENDING' },
      include: {
        team: { select: { id: true, name: true, acronym: true, description: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return invitations
  }

  async respondToInvitation(telegramId, invitationId, response) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { team: true }
    })

    if (!invitation) {
      throw new Error('Приглашение не найдено')
    }
    if (invitation.userId !== user.id) {
      throw new Error('Приглашение адресовано другому пользователю')
    }
    if (invitation.status !== 'PENDING') {
      throw new Error('Приглашение уже обработано')
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: response }
    })

    if (response === 'ACCEPTED') {
      await prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: { teamId: invitation.teamId, role: 'PLAYER' }
      })
    }

    return { invitation: updatedInvitation, accepted: response === 'ACCEPTED' }
  }

  async getAllUsers() {
    const users = await prisma.user.findMany({
      include: { team: { select: { id: true, name: true, acronym: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return users
  }

  async getFreePlayers() {
    const freePlayers = await prisma.user.findMany({
      where: { teamId: null },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        name: true,
        nickname: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    return freePlayers
  }

  async getTeamMembers(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)

    if (!user) {
      throw new Error('Пользователь не найден')
    }
    if (!user.teamId) {
      throw new Error('Вы не состоите в команде')
    }

    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      include: {
        members: {
          select: {
            id: true,
            telegramId: true,
            telegramUsername: true,
            name: true,
            nickname: true,
            role: true
          }
        },
        captain: {
          select: {
            id: true,
            telegramId: true,
            telegramUsername: true,
            name: true,
            nickname: true
          }
        }
      }
    })

    return team
  }

  async isCaptain(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)
    if (!user) return false
    return user.role === 'CAPTAIN'
  }

  async isAdmin(telegramId) {
    const user = await this.getUserByTelegramId(telegramId)
    if (!user) return false
    return user.role === 'ADMIN'
  }
}

export default new UserService() 