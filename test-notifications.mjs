// Script de test pour générer des notifications de démonstration
// Exécuter avec: node test-notifications.mjs

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Recherche des écoles avec abonnement actif...")

  const schools = await prisma.school.findMany({
    where: {
      etatCompte: "ACTIF",
      dateFinAbonnement: {
        not: null,
      },
    },
  })

  console.log(`📊 ${schools.length} école(s) avec abonnement actif trouvée(s)\n`)

  for (const school of schools) {
    if (!school.dateFinAbonnement) continue

    const now = new Date()
    const endDate = new Date(school.dateFinAbonnement)
    const diffTime = endDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    console.log(`🏫 École: ${school.nomEtablissement}`)
    console.log(`   📅 Date fin: ${endDate.toLocaleDateString("fr-FR")}`)
    console.log(`   ⏰ Jours restants: ${daysLeft}`)
    console.log(`   📍 État: ${school.etatCompte}\n`)
  }

  console.log("\n💡 Pour tester le système de notifications:")
  console.log("   1. Connectez-vous en tant que Super Admin")
  console.log("   2. Allez dans l'onglet 'Schools'")
  console.log("   3. Cliquez sur 'Vérifier Notifications'")
  console.log("   4. Vérifiez la cloche dans le header\n")

  console.log("🔧 Pour modifier la date d'expiration (test):")
  console.log("   - 15 jours: UPDATE School SET dateFinAbonnement = DATE_ADD(NOW(), INTERVAL 15 DAY) WHERE id = X;")
  console.log("   - 10 jours: UPDATE School SET dateFinAbonnement = DATE_ADD(NOW(), INTERVAL 10 DAY) WHERE id = X;")
  console.log("   - 5 jours:  UPDATE School SET dateFinAbonnement = DATE_ADD(NOW(), INTERVAL 5 DAY) WHERE id = X;")
  console.log("   - 2 jours:  UPDATE School SET dateFinAbonnement = DATE_ADD(NOW(), INTERVAL 2 DAY) WHERE id = X;")
  console.log("   - 1 jour:   UPDATE School SET dateFinAbonnement = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE id = X;")
  console.log("   - Expiré:   UPDATE School SET dateFinAbonnement = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = X;\n")
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
