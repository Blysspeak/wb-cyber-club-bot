import { BOT_TOKEN, logger, messageLogger } from '#utils'
import { Telegraf, Scenes, session } from 'telegraf'
import { MenuController } from './menu/menuController.js'
import { registerScene } from './scenes/registration.scene.js'
import { createTeamScene } from './scenes/createTeam.scene.js'
import { updateTeamScene } from './scenes/updateTeam.scene.js'
import userService from '#userService'

class Bot {
  constructor(token) {
    this.bot = new Telegraf(token)
  }

  init() {
    this.bot.use(messageLogger)
    this.bot.use(session())

    const stage = new Scenes.Stage([registerScene, createTeamScene, updateTeamScene])
    this.bot.use(stage.middleware())

    this.bot.start(async ctx => {
      try {
        const existing = await userService.getUserByTelegramId(ctx.from.id)
        if (!existing) {
          await ctx.reply('Привет! Давай зарегистрируемся.')
          return ctx.scene.enter('register')
        }
        return MenuController.sendMenu(ctx)
      } catch (err) {
        logger.error('Ошибка при /start', err)
        return ctx.reply('Произошла ошибка. Попробуйте позже.')
      }
    })

    this.bot.start(MenuController.sendMenu)
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

export const createBot = () => {
  if (!BOT_TOKEN) {
    return null
  }
  return new Bot(BOT_TOKEN).init()
}
