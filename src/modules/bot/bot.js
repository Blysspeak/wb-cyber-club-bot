import { BOT_TOKEN, logger } from '#utils'
import { Telegraf } from 'telegraf'

export const setupBot = () => {
  const bot = new Telegraf(BOT_TOKEN)

  bot.start(ctx => ctx.reply('Welcome'))

  bot.catch((err, ctx) => {
    logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
  })

  // Enable graceful stop
  process.once('SIGINT', () => {
    bot.stop('SIGINT')
    logger.info('Bot stopped by SIGINT')
  })
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM')
    logger.info('Bot stopped by SIGTERM')
  })

  return bot
}
