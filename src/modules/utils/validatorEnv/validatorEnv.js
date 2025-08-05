import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  // PostgreSQL Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DATABASE_URL: z.string().url(),

  // Redis Database
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string().min(1),
  REDIS_DB: z.coerce.number().int().nonnegative(),

  // Telegram Bot
  BOT_TOKEN: z.string().min(1),
  PORT: z.coerce.number().int().positive().optional().default(9001)
})

let validatedEnv

try {
  validatedEnv = envSchema.parse(process.env)
} catch (error) {
  console.error('Ошибка валидации переменных окружения:', error.flatten().fieldErrors)
  process.exit(1)
}

export const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DATABASE_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_DB,
  BOT_TOKEN,
  PORT
} = validatedEnv

export const env = validatedEnv
