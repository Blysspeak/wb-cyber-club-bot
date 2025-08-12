import { logger, PORT } from '#utils'
import express from 'express'

export const startServer = bot => {
  const app = express()
  const port = PORT

  app.get('/', (req, res) => {
    res.send('Bot is running!')
  })

  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
    if (bot) {
      bot.launch(() => {
        logger.info('Bot has been started')
      })
    } else {
      logger.warn('Bot is not started because BOT_TOKEN is missing')
    }
  })

  return app
}
