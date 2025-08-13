import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import { logger } from '#utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '../../../..')
const imagesRoot = path.resolve(projectRoot, 'images')

const ensureDir = dirPath => {
  fs.mkdirSync(dirPath, { recursive: true })
}

const generateUuid = () => crypto.randomUUID()

const guessExtensionByMime = mime => {
  if (!mime) return '.jpg'
  if (mime.includes('jpeg')) return '.jpg'
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('gif')) return '.gif'
  return '.jpg'
}

export const getImagesRoot = () => imagesRoot

export const resolveImageRelativePath = (category, type, uuid, mimeType) => {
  const safeCategory = String(category || 'other').toLowerCase()
  const safeType = String(type || 'other').toLowerCase()
  const ext = guessExtensionByMime(mimeType)
  return path.posix.join('images', safeCategory, safeType, `${uuid}${ext}`)
}

export const saveBufferAsImage = async ({ buffer, category, type, mimeType }) => {
  const uuid = generateUuid()
  const relativePath = resolveImageRelativePath(category, type, uuid, mimeType)
  const absolutePath = path.resolve(projectRoot, relativePath)
  ensureDir(path.dirname(absolutePath))
  await fs.promises.writeFile(absolutePath, buffer)
  const size = buffer.length
  return { uuid, relativePath, mimeType, size }
}

export const downloadTelegramPhoto = async (ctx, fileId) => {
  // Telegraf getFileLink returns URL, fetch it
  const link = await ctx.telegram.getFileLink(fileId)
  const res = await fetch(link.href)
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || undefined
  return { buffer: Buffer.from(arrayBuf), mimeType: contentType }
} 