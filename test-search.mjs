// Test de recherche Kabala - À exécuter dans le terminal Node
// node test-search.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testSearch() {
  console.log('\n🔍 Test de recherche "Kabala"\n')
  
  // Test 1: Recherche exacte
  console.log('1️⃣ Recherche exacte (lastName = "Kabala"):')
  const exact = await prisma.student.findMany({
    where: { lastName: 'Kabala' },
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  console.log(`   Résultats: ${exact.length}`)
  if (exact.length > 0) console.log('   ', exact[0])
  
  // Test 2: Recherche contains (sensible à la casse)
  console.log('\n2️⃣ Recherche contains (lastName contains "Kabala"):')
  const contains = await prisma.student.findMany({
    where: { lastName: { contains: 'Kabala' } },
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  console.log(`   Résultats: ${contains.length}`)
  if (contains.length > 0) console.log('   ', contains[0])
  
  // Test 3: Recherche contains (sans mode insensitive car non supporté par MySQL)
  console.log('\n3️⃣ Recherche contains (lastName contains "kabala" minuscules):')
  const lowercase2 = await prisma.student.findMany({
    where: { lastName: { contains: 'kabala' } },
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  console.log(`   Résultats: ${lowercase2.length}`)
  if (lowercase2.length > 0) console.log('   ', lowercase2[0])
  
  // Test 4: Recherche avec MAJUSCULES
  console.log('\n4️⃣ Recherche contains "KABALA" (majuscules):')
  const uppercase = await prisma.student.findMany({
    where: { lastName: { contains: 'KABALA' } },
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  console.log(`   Résultats: ${uppercase.length}`)
  if (uppercase.length > 0) console.log('   ', uppercase[0])
  
  // Test 5: Recherche OR multiple champs (comme l'API)
  console.log('\n5️⃣ Recherche OR (lastName, middleName, firstName) avec "Kabala":')
  const orSearch = await prisma.student.findMany({
    where: {
      OR: [
        { lastName: { contains: 'Kabala' } },
        { middleName: { contains: 'Kabala' } },
        { firstName: { contains: 'Kabala' } }
      ]
    },
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  console.log(`   Résultats: ${orSearch.length}`)
  if (orSearch.length > 0) {
    console.log('   Premiers résultats:')
    orSearch.slice(0, 3).forEach(s => console.log('   ', s))
  }
  
  // Test 6: Liste des 10 premiers étudiants
  console.log('\n6️⃣ Liste des 10 premiers étudiants (pour référence):')
  const first10 = await prisma.student.findMany({
    take: 10,
    select: { code: true, lastName: true, middleName: true, firstName: true }
  })
  first10.forEach(s => console.log('   ', s))
  
  await prisma.$disconnect()
}

testSearch()
  .catch(console.error)
  .finally(() => process.exit(0))
