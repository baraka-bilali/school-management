import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSubscriptions() {
  console.log('🔍 Vérification des abonnements...\n')

  // Toutes les écoles actives
  const activeSchools = await prisma.school.findMany({
    where: { etatCompte: 'ACTIF' },
    select: {
      id: true,
      nomEtablissement: true,
      planAbonnement: true,
      etatCompte: true
    }
  })

  console.log(`📊 Total d'écoles actives: ${activeSchools.length}\n`)

  // Grouper par plan
  const plans = activeSchools.reduce((acc, school) => {
    const plan = school.planAbonnement || 'null/basic'
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {})

  console.log('📈 Répartition par plan:')
  Object.entries(plans).forEach(([plan, count]) => {
    console.log(`   ${plan}: ${count}`)
  })

  console.log('\n📋 Détail des écoles:')
  activeSchools.forEach(school => {
    console.log(`   - ${school.nomEtablissement}: ${school.planAbonnement || '(aucun plan)'}`)
  })

  // Compter selon la logique de l'API
  const basicCount = await prisma.school.count({
    where: { 
      etatCompte: "ACTIF",
      OR: [
        { planAbonnement: "basic" },
        { planAbonnement: "Basic" },
        { planAbonnement: "BASIC" },
        { planAbonnement: null }
      ]
    }
  })

  const premiumCount = await prisma.school.count({
    where: { 
      etatCompte: "ACTIF",
      OR: [
        { planAbonnement: "premium" },
        { planAbonnement: "Premium" },
        { planAbonnement: "PREMIUM" },
        { planAbonnement: "pro" }
      ]
    }
  })

  const enterpriseCount = await prisma.school.count({
    where: { 
      etatCompte: "ACTIF",
      OR: [
        { planAbonnement: "enterprise" },
        { planAbonnement: "Enterprise" },
        { planAbonnement: "ENTERPRISE" }
      ]
    }
  })

  console.log('\n🎯 Comptage selon l\'API:')
  console.log(`   Basic: ${basicCount}`)
  console.log(`   Premium (pro): ${premiumCount}`)
  console.log(`   Enterprise: ${enterpriseCount}`)
  console.log(`   Total: ${basicCount + premiumCount + enterpriseCount}`)

  await prisma.$disconnect()
}

checkSubscriptions().catch(console.error)
