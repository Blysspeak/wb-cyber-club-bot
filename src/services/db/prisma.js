import { PrismaClient } from '@prisma/client'

const prismaGlobal = globalThis

let prismaInstance = prismaGlobal.__prisma__

if (!prismaInstance) {
  prismaInstance = new PrismaClient({
    log: [
      // { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' }
    ]
  })
  prismaGlobal.__prisma__ = prismaInstance
}

export const prisma = prismaInstance 