import { env, logger } from '#utils'
import { startServer } from './app/app.js'
import { setupBot } from './modules/bot/bot.js'
import { connectCache } from '#cache'

if (!env) {
  process.exit(1)
}

await connectCache()

const bot = setupBot()
startServer(bot)

logger.info('Application has been started')
