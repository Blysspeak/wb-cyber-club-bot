import { logger } from './logger.js'

export const messageLogger = (ctx, next) => {
  if (ctx.update && ctx.update.message && ctx.update.message.text) {
    const { from, text } = ctx.update.message
    const { id, username } = from
    logger.message(`[${id} ${username}] - ${text}`)
  }
  return next()
}
