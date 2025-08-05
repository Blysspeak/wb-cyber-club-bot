import { logger } from '#utils'
import express from 'express'

export const startServer = bot => {
  const app = express()
  const port = 10001

  app.get('/', (req, res) => {
    res.send('Bot is running!')
  })

  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
    bot.launch(() => {
      logger.info('Bot has been started')
    })
  })

  return app
}
