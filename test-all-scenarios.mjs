// Script de test complet avec tous les scénarios
// Usage: node test-all-scenarios.mjs <schoolId>
// Exemple: node test-all-scenarios.mjs 8

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const scenarios = [
  { days: 15, label: "15 jours (Bleu - Normal)" },
  { days: 10, label: "10 jours (Bleu - Normal)" },
  { days: 5, label: "5 jours (Jaune - Attention)" },
  { days: 2, label: "2 jours (Orange - Urgent)" },
  { days: 1, label: "1 jour (Orange - Très Urgent)" },
  { days: 0, label: "Expiré (Rouge - Critique)" },
]

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.log("❌ Usage: node test-all-scenarios.mjs <schoolId>")
    console.log("   Exemple: node test-all-scenarios.mjs 8")
    process.exit(1)
  }

  const schoolId = parseInt(args[0])

  if (isNaN(schoolId)) {
    console.log("❌ L'ID de l'école doit être un nombre")
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

  console.log(`🏫 École: ${school.nomEtablissement}`)
  console.log("📋 Test de tous les scénarios d'expiration\n")
  console.log("─".repeat(60))

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i]
    console.log(`\n${i + 1}. Test: ${scenario.label}`)

    // Nettoyer les notifications existantes
    await prisma.notification.deleteMany({
      where: { schoolId: schoolId },
    })

    // Calculer la nouvelle date
    const now = new Date()
    const newDate = new Date(now)
    newDate.setDate(newDate.getDate() + scenario.days)

    // Mettre à jour l'école
    await prisma.school.update({
      where: { id: schoolId },
      data: {
        dateFinAbonnement: newDate,
        etatCompte: scenario.days >= 0 ? "ACTIF" : "SUSPENDU",
      },
    })

    console.log(`   📅 Date: ${newDate.toLocaleDateString("fr-FR")}`)
    console.log(`   📍 État: ${scenario.days >= 0 ? "ACTIF" : "SUSPENDU"}`)
    console.log(`   💡 Action: Cliquez sur "Vérifier Notifications" dans l'interface`)
    console.log(`   ⏸️  Appuyez sur Entrée pour passer au scénario suivant...`)

    // Attendre l'entrée utilisateur
    if (i < scenarios.length - 1) {
      await new Promise((resolve) => {
        process.stdin.once("data", () => resolve())
      })
      console.log("─".repeat(60))
    }
  }

  console.log("\n✅ Tests terminés!")
  console.log("\n💡 Instructions finales:")
  console.log("   1. Allez dans l'interface Super Admin")
  console.log("   2. Pour chaque scénario, cliquez sur 'Vérifier Notifications'")
  console.log("   3. Vérifiez que la couleur et le message sont corrects")
  console.log("   4. Marquez les notifications comme lues entre chaque test")

  console.log("\n🎨 Code couleur attendu:")
  console.log("   🔵 Bleu: 10-15 jours")
  console.log("   🟡 Jaune: 5 jours")
  console.log("   🟠 Orange: 1-2 jours")
  console.log("   🔴 Rouge: Expiré")

  process.exit(0)
}

// Gérer Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n❌ Test interrompu")
  await prisma.$disconnect()
  process.exit(0)
})

main()
  .catch((e) => {
    console.error("❌ Erreur:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
