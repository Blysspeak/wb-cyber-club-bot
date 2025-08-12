import { prisma } from '../prisma.js'
import { getUserByTelegramId } from './user.read.js'
import { cacheDel } from '#cache'

export const createTeam = async (telegramId, teamData) => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')
  if (user.teamId) throw new Error('Вы уже состоите в команде')

  const existingAcronym = await prisma.team.findUnique({ where: { acronym: teamData.acronym.toUpperCase() } })
  if (existingAcronym) throw new Error('Акроним команды уже существует')

  const existingName = await prisma.team.findUnique({ where: { name: teamData.name } })
  if (existingName) throw new Error('Название команды уже существует')

  const team = await prisma.team.create({
    data: {
      name: teamData.name,
      acronym: teamData.acronym.toUpperCase(),
      description: teamData.description || null,
      logo: teamData.logo || null,
      captainId: user.id,
      members: { connect: { id: user.id } }
    },
    include: { captain: true, members: true }
  })

  await prisma.user.update({ where: { id: user.id }, data: { role: 'CAPTAIN', teamId: team.id } })

  await Promise.all([
    cacheDel(['user', 'byTg', String(telegramId)]),
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)])
  ])

  return team
}

export const getUserTeam = async telegramId => {
  return prisma.team.findFirst({
    where: { captain: { telegramId: BigInt(telegramId) } },
    include: {
      captain: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true } },
      members: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true, role: true } },
      invitations: {
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true } } }
      }
    }
  })
}

export const updateTeam = async (telegramId, updateData) => {
  const team = await getUserTeam(telegramId)
  if (!team) throw new Error('Вы не являетесь капитаном команды')

  if (updateData.acronym) {
    const existingAcronym = await prisma.team.findFirst({ where: { acronym: updateData.acronym.toUpperCase(), NOT: { id: team.id } } })
    if (existingAcronym) throw new Error('Акроним команды уже существует')
  }
  if (updateData.name) {
    const existingName = await prisma.team.findFirst({ where: { name: updateData.name, NOT: { id: team.id } } })
    if (existingName) throw new Error('Название команды уже существует')
  }

  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      name: updateData.name || undefined,
      acronym: updateData.acronym ? updateData.acronym.toUpperCase() : undefined,
      description: updateData.description,
      logo: updateData.logo
    },
    include: { captain: true, members: true }
  })

  await Promise.all([
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)])
  ])

  return updated
}

export const invitePlayer = async (telegramId, playerTelegramId) => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  const player = await prisma.user.findUnique({ where: { telegramId: BigInt(playerTelegramId) } })
  if (!player) throw new Error('Пользователь не найден')
  if (player.teamId) throw new Error('Игрок уже состоит в команде')

  const existingInvitation = await prisma.invitation.findFirst({ where: { teamId: captainTeam.id, userId: player.id } })
  if (existingInvitation) {
    if (existingInvitation.status === 'PENDING') throw new Error('Игрок уже приглашен в команду')
    if (existingInvitation.status === 'ACCEPTED') throw new Error('Игрок уже состоит в команде')
    // Re-invite previously rejected user by reopening the same invitation
    const reopened = await prisma.invitation.update({
      where: { id: existingInvitation.id },
      data: { status: 'PENDING' },
      include: { team: true, user: true }
    })
    await cacheDel(['team', 'byUserTg', String(telegramId)])
    return reopened
  }

  const invitation = await prisma.invitation.create({
    data: { teamId: captainTeam.id, userId: player.id, status: 'PENDING' },
    include: { team: true, user: true }
  })

  await cacheDel(['team', 'byUserTg', String(telegramId)])
  return invitation
}

export const removePlayer = async (telegramId, playerId) => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  const player = await prisma.user.findUnique({ where: { id: playerId } })
  if (!player || player.teamId !== captainTeam.id) throw new Error('Игрок не найден в вашей команде')
  if (player.id === captainTeam.captainId) throw new Error('Капитан не может удалить сам себя из команды')

  const updatedPlayer = await prisma.user.update({ where: { id: playerId }, data: { teamId: null, role: 'PLAYER' } })

  await Promise.all([
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)]),
    cacheDel(['user', 'byTg', String(player.telegramId)])
  ])

  return updatedPlayer
}

export const deleteTeam = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  await prisma.team.delete({ where: { id: captainTeam.id } })

  await Promise.all([
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)])
  ])

  return { success: true, message: 'Команда успешно удалена' }
}

export const getTeamInvitations = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  return prisma.invitation.findMany({
    where: { teamId: captainTeam.id },
    include: {
      user: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true } }
    }
  })
}

export const getTeamStats = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  const tournamentParticipations = await prisma.teamTournament.count({ where: { teamId: captainTeam.id } })
  const applicationsCount = await prisma.tournamentApplication.count({ where: { teamId: captainTeam.id } })
  const approvedApplications = await prisma.tournamentApplication.count({ where: { teamId: captainTeam.id, status: 'APPROVED' } })

  return {
    totalMembers: captainTeam.members.length,
    totalInvitations: captainTeam.invitations.length,
    totalApplications: applicationsCount,
    approvedApplications: approvedApplications,
    tournamentParticipations: tournamentParticipations
  }
}

export const getTeamComposition = async telegramId => {
  const captainTeam = await getUserTeam(telegramId)
  if (!captainTeam) throw new Error('Вы не являетесь капитаном команды')

  return prisma.team.findUnique({
    where: { id: captainTeam.id },
    include: {
      captain: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true, discord: true } },
      members: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true, discord: true, role: true } },
      invitations: {
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, telegramId: true, telegramUsername: true, name: true, nickname: true } } }
      }
    }
  })
} 