import { logger, PORT } from '#utils'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

export const startServer = bot => {
  const app = express()
  const port = PORT

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const projectRoot = path.resolve(__dirname, '../../')
  app.use('/images', express.static(path.resolve(projectRoot, 'images')))

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
