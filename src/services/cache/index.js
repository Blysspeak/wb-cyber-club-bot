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

export const cacheGet = async (keyParts, fallbackFn, ttlSec = 60) => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  const data = await fallbackFn()
  await redis.set(key, JSON.stringify(data), 'EX', ttlSec)
  return data
}

export const cacheSet = async (keyParts, value, ttlSec = 60) => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  await redis.set(key, JSON.stringify(value), 'EX', ttlSec)
}

export const cacheDel = async keyParts => {
  const key = toKey(Array.isArray(keyParts) ? keyParts : [keyParts])
  await redis.del(key)
}

export default redis 