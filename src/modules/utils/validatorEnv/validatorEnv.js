import dotenv from 'dotenv'
import { z } from 'zod'
import { logger } from '../logger/logger.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const candidates = [
	path.resolve(process.cwd(), '.env'),
	path.resolve(__dirname, '../../..', '.env')
]

let envPath = null
let fileSize = 0

for (const candidate of candidates) {
	try {
		const stat = fs.statSync(candidate)
		if (stat.isFile()) {
			envPath = candidate
			fileSize = stat.size
			break
		}
	} catch {
		// ignore
	}
}

if (!envPath) {
	logger.warn(`.env file not found. Checked paths: ${candidates.join(' | ')}`)
} else {
	logger.info(`Using .env: ${envPath} (size: ${fileSize} bytes)`) 
}

const loadEnvFile = (filePath, override = true) => {
	if (!filePath) return { loaded: 0 }

	const buffer = fs.readFileSync(filePath)
	let text = ''

	// Detect BOM/encoding and decode
	if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
		// UTF-16 LE
		text = buffer.toString('utf16le')
	} else if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
		// UTF-16 BE → swap bytes then decode as LE
		const swapped = Buffer.allocUnsafe(buffer.length)
		for (let i = 0; i < buffer.length; i += 2) {
			swapped[i] = buffer[i + 1]
			swapped[i + 1] = buffer[i]
		}
		text = swapped.toString('utf16le')
	} else {
		// UTF-8 (with or without BOM)
		text = buffer.toString('utf8').replace(/^\uFEFF/, '')
	}

	const parsed = dotenv.parse(text)
	let count = 0
	for (const [key, value] of Object.entries(parsed)) {
		if (override || process.env[key] === undefined) {
			process.env[key] = value
			count += 1
		}
	}
	logger.info(`Loaded environment variables from .env: ${count}`)
	if (count === 0) {
		logger.warn('No KEY=VALUE pairs found in .env. Check file contents and encoding.')
	}
	return { loaded: count }
}

// Load .env with robust decoder and override existing env
loadEnvFile(envPath, true)

const envSchema = z.object({
	// PostgreSQL Database (optional for now)
	DB_HOST: z.string().min(1).optional(),
	DB_PORT: z.coerce.number().int().positive().optional(),
	DB_USER: z.string().min(1).optional(),
	DB_PASSWORD: z.string().min(1).optional(),
	DB_NAME: z.string().min(1).optional(),
	DATABASE_URL: z.string().url().optional(),

	// Redis Database (optional for now)
	REDIS_HOST: z.string().min(1).optional(),
	REDIS_PORT: z.coerce.number().int().positive().optional(),
	REDIS_PASSWORD: z.string().min(1).optional(),
	REDIS_DB: z.coerce.number().int().nonnegative().optional(),

	// Telegram Bot (optional to allow server-only startup)
	BOT_TOKEN: z.string().min(1).optional(),
	PORT: z.coerce.number().int().positive().optional().default(9001)
})

let validatedEnv

try {
	validatedEnv = envSchema.parse(process.env)
} catch (error) {
	logger.error('Environment variables validation error:', error.flatten().fieldErrors)
	process.exit(1)
}

if (!validatedEnv.BOT_TOKEN) {
	logger.warn('BOT_TOKEN is not set. The bot will not be started (the server will start without it).')
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
