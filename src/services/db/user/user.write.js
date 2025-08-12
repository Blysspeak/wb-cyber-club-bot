import { prisma } from '../prisma.js'
import { getUserByTelegramId } from './user.read.js'

export const registerUser = async userData => {
  const existingUser = await prisma.user.findUnique({
    where: { telegramId: BigInt(userData.telegramId) }
  })
  if (existingUser) throw new Error('Пользователь уже зарегистрирован')

  return prisma.user.create({
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

  return prisma.user.update({
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
}

export const leaveTeam = async telegramId => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')
  if (!user.teamId) throw new Error('Вы не состоите в команде')

  const team = await prisma.team.findUnique({ where: { id: user.teamId } })
  if (team && team.captainId === user.id) {
    throw new Error('Капитан не может покинуть команду. Сначала удалите команду или передайте капитанство.')
  }

  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { teamId: null, role: 'PLAYER' }
  })
}

export const respondToInvitation = async (telegramId, invitationId, response) => {
  const user = await getUserByTelegramId(telegramId)
  if (!user) throw new Error('Пользователь не найден')

  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId }, include: { team: true } })
  if (!invitation) throw new Error('Приглашение не найдено')
  if (invitation.userId !== user.id) throw new Error('Приглашение адресовано другому пользователю')
  if (invitation.status !== 'PENDING') throw new Error('Приглашение уже обработано')

  const updatedInvitation = await prisma.invitation.update({ where: { id: invitationId }, data: { status: response } })

  if (response === 'ACCEPTED') {
    await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { teamId: invitation.teamId, role: 'PLAYER' } })
  }

  return { invitation: updatedInvitation, accepted: response === 'ACCEPTED' }
} 