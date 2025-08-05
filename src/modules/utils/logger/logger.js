import pino from 'pino'

const customLevels = {
  // pino default levels:
  // fatal: 60
  // error: 50
  // warn: 40
  // info: 30
  // debug: 20
  // trace: 10
  sos: 90, // For critical alerts that need immediate attention
  success: 36,
  message: 35
}

const customColors = [
  'fatal:bold red',
  'error:red',
  'warn:yellow',
  'info:blue',
  'success:green',
  'message:magenta',
  'debug:cyan',
  'trace:gray',
  'sos:bold white on red'
]

export const logger = pino({
  customLevels: customLevels,
  level: 'trace', // Log all levels from trace upwards
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
      customLevels: Object.keys(customLevels)
        .map(level => `${level}:${customLevels[level]}`)
        .join(','),
      customColors: customColors.join(',')
    }
  }
})
