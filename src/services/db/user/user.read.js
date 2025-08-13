import { prisma } from '#prisma'
import { cacheGet, cacheDel } from '#cache'

export const getUserByTelegramId = async telegramId => {
  return cacheGet(['user', 'byTg', String(telegramId)], async () => {
    return prisma.user.findUnique({
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
  }, 60)
}

export const getUserById = async id => {
  return prisma.user.findUnique({ where: { id: Number(id) } })
}

export const getUserStats = async telegramId => {
  return cacheGet(['user', 'stats', String(telegramId)], async () => {
    const user = await getUserByTelegramId(telegramId)
    if (!user) throw new Error('Пользователь не найден')

    const totalTournaments = await prisma.teamTournament.count({
      where: { team: { members: { some: { telegramId: BigInt(telegramId) } } } }
    })
    const totalApplications = await prisma.tournamentApplication.count({
      where: { team: { members: { some: { telegramId: BigInt(telegramId) } } } }
    })

    return {
      totalTournaments,
      totalApplications,
      role: user.role,
      team: user.team ? { id: user.team.id, name: user.team.name, acronym: user.team.acronym } : null
    }
  }, 60)
}

export const getAllUsers = async () => {
  return prisma.user.findMany({
    include: { team: { select: { id: true, name: true, acronym: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

export const getFreePlayers = async () => {
  return prisma.user.findMany({
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
}

export const getTeamMembers = async telegramId => {
  return cacheGet(['team', 'byUserTg', String(telegramId)], async () => {
    const user = await getUserByTelegramId(telegramId)
    if (!user) throw new Error('Пользователь не найден')
    if (!user.teamId) throw new Error('Вы не состоите в команде')

    return prisma.team.findUnique({
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
  }, 60)
}

export const isCaptain = async telegramId => {
  const user = await getUserByTelegramId(telegramId)
  return !!user && user.role === 'CAPTAIN'
}

export const isAdmin = async telegramId => {
  const user = await getUserByTelegramId(telegramId)
  return !!user && user.role === 'ADMIN'
}

export const getTeamInfoText = async telegramId => {
  return cacheGet(['team', 'infoText', String(telegramId)], async () => {
    const team = await getTeamMembers(telegramId)
    if (!team) return 'Вы не состоите в команде'

    const title = `Команда: ${team.name} (${team.acronym})`
    const description = `Описание: ${team.description ? team.description : '-'}`
    const logo = `Логотип: ${team.logo ? team.logo : '-'}`

    const formatUser = (u, role) => {
      const name = u.nickname || u.name || u.telegramUsername || u.id
      const username = u.telegramUsername ? ` (@${String(u.telegramUsername).replace(/^@/, '')})` : ''
      return `- ${name}${username} (${role})`
    }

    const captainLine = team.captain ? formatUser(team.captain, 'CAPTAIN') : ''

    const memberLines = (team.members || [])
      .filter(m => !team.captain || m.id !== team.captain.id)
      .map(m => formatUser(m, m.role))
      .join('\n')

    const roster = `Состав:\n${[captainLine, memberLines].filter(Boolean).join('\n')}`

    return [title, description, logo, roster].join('\n')
  }, 60)
}

export const getUserByTelegramUsername = async username => {
  if (!username) return null
  const clean = String(username).replace(/^@/, '')
  if (!clean) return null
  return prisma.user.findFirst({
    where: { telegramUsername: clean }
  })
} 