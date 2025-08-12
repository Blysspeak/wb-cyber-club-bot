import Redis from 'ioredis'
import { logger, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } from '#utils'

const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD || undefined,
  db: Number(REDIS_DB) || 0,
  lazyConnect: true
})

redis.on('error', err => logger.error('Redis error', err))
redis.on('connect', () => logger.info('Redis connected'))

export const connectCache = async () => {
  if (redis.status === 'end') return
  if (redis.status === 'ready' || redis.status === 'connecting') return
  await redis.connect()
}

const toKey = parts => parts.filter(Boolean).join(':')
const safeStringify = value =>
  JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
const safeParse = str => JSON.parse(str)

export const cacheGet = async (keyParts, fallbackFn, ttlSec = 60) => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  const cached = await redis.get(key)
  if (cached) return safeParse(cached)
  const data = await fallbackFn()
  try {
    await redis.set(key, safeStringify(data), 'EX', ttlSec)
  } catch (e) {
    logger.warn(`Cache set failed for ${key}: ${e.message}`)
  }
  return data
}

export const cacheSet = async (keyParts, value, ttlSec = 60) => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  await redis.set(key, safeStringify(value), 'EX', ttlSec)
}

export const cacheDel = async keyParts => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  await redis.del(key)
}

export default redis 