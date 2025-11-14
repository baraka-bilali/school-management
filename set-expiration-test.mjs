// Script pour modifier la date d'expiration d'un abonnement (pour tests)
// Usage: node set-expiration-test.mjs <schoolId> <days>
// Exemple: node set-expiration-test.mjs 8 5

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log("❌ Usage: node set-expiration-test.mjs <schoolId> <days>")
    console.log("   Exemples:")
    console.log("   - node set-expiration-test.mjs 8 15  (15 jours)")
    console.log("   - node set-expiration-test.mjs 8 10  (10 jours)")
    console.log("   - node set-expiration-test.mjs 8 5   (5 jours)")
    console.log("   - node set-expiration-test.mjs 8 2   (2 jours)")
    console.log("   - node set-expiration-test.mjs 8 1   (1 jour)")
    console.log("   - node set-expiration-test.mjs 8 0   (expiré)")
    console.log("   - node set-expiration-test.mjs 8 -1  (expiré depuis 1 jour)")
    process.exit(1)
  }

  const schoolId = parseInt(args[0])
  const days = parseInt(args[1])

  if (isNaN(schoolId) || isNaN(days)) {
    console.log("❌ Les arguments doivent être des nombres")
    process.exit(1)
  }

  // Vérifier que l'école existe
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  })

  if (!school) {
    console.log(`❌ École avec ID ${schoolId} non trouvée`)
    process.exit(1)
  }

  // Calculer la nouvelle date
  const now = new Date()
  const newDate = new Date(now)
  newDate.setDate(newDate.getDate() + days)

  // Mettre à jour l'école
  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: {
      dateFinAbonnement: newDate,
      etatCompte: days >= 0 ? "ACTIF" : "SUSPENDU",
    },
  })

  console.log("✅ Date d'expiration modifiée avec succès!")
  console.log(`   🏫 École: ${school.nomEtablissement}`)
  console.log(`   📅 Nouvelle date: ${newDate.toLocaleDateString("fr-FR")}`)
  console.log(`   ⏰ Jours restants: ${days}`)
  console.log(`   📍 État: ${updated.etatCompte}`)
  console.log("\n💡 Maintenant:")
  console.log("   1. Allez dans l'interface Super Admin")
  console.log("   2. Cliquez sur 'Vérifier Notifications'")
  console.log("   3. Vérifiez la cloche pour voir les notifications")
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
