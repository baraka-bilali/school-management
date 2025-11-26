import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateAdminsToSchool() {
  try {
    console.log('🔄 Migration des administrateurs vers "Collège Technique Don Bosco"...\n')
    
    // Récupérer l'école "Collège Technique Don Bosco"
    const donBosco = await prisma.school.findFirst({
      where: { nomEtablissement: 'Collège Technique Don Bosco' }
    })

    if (!donBosco) {
      console.error('❌ École "Collège Technique Don Bosco" introuvable!')
      return
    }

    console.log(`✅ École trouvée: ${donBosco.nomEtablissement} (ID: ${donBosco.id})\n`)

    // Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    })

    console.log(`📊 ${admins.length} administrateur(s) à vérifier\n`)

    let updated = 0
    for (const admin of admins) {
      if (admin.schoolId !== donBosco.id) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { schoolId: donBosco.id }
        })
        console.log(`✅ Migré: ${admin.email} (de School ID: ${admin.schoolId || 'NULL'} vers ${donBosco.id})`)
        updated++
      } else {
        console.log(`⏭️  Déjà à Don Bosco: ${admin.email}`)
      }
    }

    console.log(`\n🎉 Migration terminée: ${updated} administrateur(s) migré(s) vers "Collège Technique Don Bosco"`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateAdminsToSchool()
