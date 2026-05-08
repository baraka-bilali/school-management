import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Configuration optimisée pour Supabase/PostgreSQL
prisma.$connect()
  .then(() => {
    console.log("✅ Prisma connected to Supabase")
    
    // Configuration des timeouts adaptés à la latence EU->Africa
    prisma.$executeRaw`SET statement_timeout = '10000'` // 10s max par query
    prisma.$executeRaw`SET idle_in_transaction_session_timeout = '30000'` // 30s max transaction idle
  })
  .catch((e) => {
    console.error("❌ Prisma connection failed:", e)
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Gérer la déconnexion propre lors de l'arrêt
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}


