import { BOT_TOKEN, logger, messageLogger } from '#utils'
import { Telegraf } from 'telegraf'

class Bot {
  constructor(token) {
    this.bot = new Telegraf(token)
  }

  init() {
    this.bot.use(messageLogger)
    this.bot.start(ctx => ctx.reply('Welcome'))
    this.handleErrors()
    this.handleSignals()
    logger.info('Bot initialized')
    return this.bot
  }

  handleErrors() {
    this.bot.catch((err, ctx) => {
      logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err)
    })
  }

  handleSignals() {
    process.once('SIGINT', () => {
      this.bot.stop('SIGINT')
      logger.info('Bot stopped by SIGINT')
    })
    process.once('SIGTERM', () => {
      this.bot.stop('SIGTERM')
      logger.info('Bot stopped by SIGTERM')
    })
  }
}

export const bot = new Bot(BOT_TOKEN).init()
