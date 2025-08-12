import { prisma } from '../prisma.js'
import { getUserByTelegramId } from './user.read.js'
import { cacheDel } from '#cache'

export const registerUser = async userData => {
  const existingUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(userData.telegramId) }
  })
  if (existingUser) throw new Error('Пользователь уже зарегистрирован')

  const user = await prisma.user.create({
    data: {
      telegramId: BigInt(userData.telegramId),
      telegramUsername: userData.telegramUsername || null,
      wildberriesId: userData.wildberriesId,
      name: userData.name,
      nickname: userData.nickname,
      discord: userData.discord || null,
      birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
      role: 'PLAYER',
      games: userData.games || undefined,
      mlbbId: userData.mlbbId || undefined,
      mlbbServer: userData.mlbbServer || undefined
    }
  })

  await Promise.all([
    cacheDel(['user', 'byTg', String(userData.telegramId)]),
    cacheDel(['user', 'stats', String(userData.telegramId)])
  ])

  return user
}

export const updateUserProfile = async (telegramId, updateData) => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')

  if (updateData.wildberriesId && updateData.wildberriesId !== user.wildberriesId) {
    const existingUserByWb = await prisma.user.findFirst({
      where: { wildberriesId: updateData.wildberriesId, NOT: { id: user.id } }
    })
    if (existingUserByWb) throw new Error('Wildberries ID уже используется другим пользователем')
  }

  const updated = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: {
      wildberriesId: updateData.wildberriesId ?? undefined,
      name: updateData.name ?? undefined,
      nickname: updateData.nickname ?? undefined,
      discord: updateData.discord ?? undefined,
      birthDate: updateData.birthDate ? new Date(updateData.birthDate) : undefined,
      games: updateData.games ?? undefined,
      mlbbId: updateData.mlbbId ?? undefined,
      mlbbServer: updateData.mlbbServer ?? undefined
    },
    include: { team: true }
  })

  await Promise.all([
    cacheDel(['user', 'byTg', String(telegramId)]),
    cacheDel(['user', 'stats', String(telegramId)]),
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)])
  ])

  return updated
}

export const leaveTeam = async telegramId => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')
  if (!user.teamId) throw new Error('Вы не состоите в команде')

  const team = await prisma.team.findUnique({ where: { id: user.teamId } })
  if (team && team.captainId === user.id) {
    throw new Error('Капитан не может покинуть команду. Сначала удалите команду или передайте капитанство.')
  }

  const updated = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { teamId: null, role: 'PLAYER' }
  })

  await Promise.all([
    cacheDel(['user', 'byTg', String(telegramId)]),
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)])
  ])

  return updated
}

export const respondToInvitation = async (telegramId, invitationId, response) => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId }, include: { team: { include: { captain: { select: { telegramId: true } } } } } })
  if (!invitation) throw new Error('Приглашение не найдено')
  if (invitation.userId !== user.id) throw new Error('Приглашение адресовано другому пользователю')
  if (invitation.status !== 'PENDING') throw new Error('Приглашение уже обработано')

  const updatedInvitation = await prisma.invitation.update({ where: { id: invitationId }, data: { status: response } })

  if (response === 'ACCEPTED') {
    await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { teamId: invitation.teamId, role: 'PLAYER' } })
  }

  await Promise.all([
    cacheDel(['user', 'byTg', String(telegramId)]),
    cacheDel(['user', 'stats', String(telegramId)]),
    cacheDel(['team', 'byUserTg', String(telegramId)]),
    cacheDel(['team', 'infoText', String(telegramId)]),
    // also invalidate captain's team caches
    cacheDel(['team', 'byUserTg', String(invitation.team?.captain?.telegramId || '')]).catch(() => {}),
    cacheDel(['team', 'infoText', String(invitation.team?.captain?.telegramId || '')]).catch(() => {})
  ])

  return { invitation: updatedInvitation, accepted: response === 'ACCEPTED' }
} 