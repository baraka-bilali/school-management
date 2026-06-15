import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

if (typeof window === "undefined") {
  const cleanup = async () => {
    await prisma.$disconnect()
  }
  process.on("beforeExit", cleanup)
  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}
