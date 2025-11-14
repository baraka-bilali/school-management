// Script pour nettoyer toutes les notifications (utile pour les tests)
// Usage: node clear-notifications.mjs

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🗑️  Suppression de toutes les notifications...")

  const result = await prisma.notification.deleteMany({})

  console.log(`✅ ${result.count} notification(s) supprimée(s)`)
  console.log("\n💡 Vous pouvez maintenant:")
  console.log("   1. Configurer une date d'expiration avec: node set-expiration-test.mjs <id> <days>")
  console.log("   2. Générer de nouvelles notifications en cliquant sur 'Vérifier Notifications'")
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
