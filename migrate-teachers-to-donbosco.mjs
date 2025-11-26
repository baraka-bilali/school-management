import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateTeachersToSchool() {
  try {
    console.log('🔄 Migration des enseignants vers "Collège Technique Don Bosco"...\n')
    
    // Récupérer l'école "Collège Technique Don Bosco"
    const donBosco = await prisma.school.findFirst({
      where: { nomEtablissement: 'Collège Technique Don Bosco' }
    })

    if (!donBosco) {
      console.error('❌ École "Collège Technique Don Bosco" introuvable!')
      return
    }

    console.log(`✅ École trouvée: ${donBosco.nomEtablissement} (ID: ${donBosco.id})\n`)

    // Récupérer tous les enseignants
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            schoolId: true
          }
        }
      }
    })

    console.log(`📊 ${teachers.length} enseignant(s) à vérifier\n`)

    let updated = 0
    for (const teacher of teachers) {
      if (teacher.user?.schoolId !== donBosco.id) {
        await prisma.user.update({
          where: { id: teacher.userId },
          data: { schoolId: donBosco.id }
        })
        console.log(`✅ Migré: ${teacher.lastName} ${teacher.firstName}`)
        updated++
      } else {
        console.log(`⏭️  Déjà à Don Bosco: ${teacher.lastName} ${teacher.firstName}`)
      }
    }

    console.log(`\n🎉 Migration terminée: ${updated} enseignant(s) migré(s) vers "Collège Technique Don Bosco"`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateTeachersToSchool()
