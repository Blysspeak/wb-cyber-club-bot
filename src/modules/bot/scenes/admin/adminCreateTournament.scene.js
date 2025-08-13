import { Scenes } from 'telegraf'
import { z } from 'zod'
import userService from '#userService'
import { tournamentAdminService } from '#adminService'
import { downloadTelegramPhoto, saveBufferAsImage } from '#utils'

const schema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000).optional(),
  prizePool: z.string().min(1).optional(),
  maxTeams: z.coerce.number().int().min(2).max(1000),
  game: z.enum(['MLBB']).default('MLBB')
})

const steps = []

steps.push(async ctx => {
  const isAdmin = await userService.isAdmin(ctx.from.id)
  if (!isAdmin) {
    await ctx.reply('Доступ только для администраторов')
    return ctx.scene.leave()
  }
  await ctx.reply('Введите название турнира (3-200 символов):')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  const name = ctx.message?.text?.trim()
  if (!name || name.length < 3 || name.length > 200) {
    await ctx.reply('Некорректное название. Повторите:')
    return
  }
  ctx.wizard.state.form = { name }
  await ctx.reply('Введите описание турнира (10-2000 символов), либо "-" чтобы пропустить:')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  const text = ctx.message?.text?.trim()
  const description = text === '-' ? undefined : text
  if (description && (description.length < 10 || description.length > 2000)) {
    await ctx.reply('Некорректное описание. Повторите или введите "-" для пропуска:')
    return
  }
  ctx.wizard.state.form.description = description
  await ctx.reply('Введите призовой фонд (например: 50 000₽), либо "-" чтобы пропустить:')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  const text = ctx.message?.text?.trim()
  const prizePool = text === '-' ? undefined : text
  if (prizePool && prizePool.length < 1) {
    await ctx.reply('Некорректный призовой фонд. Повторите или "-" для пропуска:')
    return
  }
  ctx.wizard.state.form.prizePool = prizePool
  await ctx.reply('Введите максимальное количество команд (2-1000):')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  const maxTeamsStr = ctx.message?.text?.trim()
  const parsed = Number(maxTeamsStr)
  if (!Number.isInteger(parsed) || parsed < 2 || parsed > 1000) {
    await ctx.reply('Некорректное число. Введите от 2 до 1000:')
    return
  }
  ctx.wizard.state.form.maxTeams = parsed
  await ctx.reply('Игра по умолчанию MLBB. Введите MLBB чтобы подтвердить:')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  const game = ctx.message?.text?.trim()?.toUpperCase()
  if (game !== 'MLBB') {
    await ctx.reply('Поддерживается только MLBB. Введите MLBB:')
    return
  }
  ctx.wizard.state.form.game = 'MLBB'
  await ctx.reply('Отправьте картинку турнира фото-сообщением')
  return ctx.wizard.next()
})

steps.push(async ctx => {
  // Accept either photo or '-' to skip
  const maybeSkip = ctx.message?.text?.trim()
  if (maybeSkip === '-') {
    try {
      const data = schema.parse(ctx.wizard.state.form)
      const created = await tournamentAdminService.createTournament(data)
      await ctx.reply(`Турнир создан без картинки: #${created.id} — ${created.name}`)
    } catch (e) {
      await ctx.reply('Ошибка при создании турнира. Проверьте данные и попробуйте снова.')
    }
    return ctx.scene.leave()
  }

  const photos = ctx.message?.photo
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    await ctx.reply('Пришлите фото-сообщением изображение турнира:')
    return
  }

  try {
    const best = photos[photos.length - 1]
    const { buffer, mimeType } = await downloadTelegramPhoto(ctx, best.file_id)
    const saved = await saveBufferAsImage({ buffer, category: 'admin', type: 'tournament', mimeType })
    const data = schema.parse(ctx.wizard.state.form)
    const { tournament } = await tournamentAdminService.createTournamentWithImage(data, saved)
    await ctx.reply(`Турнир создан: #${tournament.id} — ${tournament.name}`)
  } catch (e) {
    await ctx.reply('Не удалось сохранить изображение. Турнир не создан. Повторите процесс.')
  }
  return ctx.scene.leave()
})

export const adminCreateTournamentScene = new Scenes.WizardScene('adminCreateTournament', ...steps) 