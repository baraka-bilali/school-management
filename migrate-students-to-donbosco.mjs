import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateStudentsToSchool() {
  try {
    console.log('🔄 Migration des élèves vers "Collège Technique Don Bosco"...\n')
    
    // Récupérer l'école "Collège Technique Don Bosco"
    const donBosco = await prisma.school.findFirst({
      where: { nomEtablissement: 'Collège Technique Don Bosco' }
    })

    if (!donBosco) {
      console.error('❌ École "Collège Technique Don Bosco" introuvable!')
      return
    }

    console.log(`✅ École trouvée: ${donBosco.nomEtablissement} (ID: ${donBosco.id})\n`)

    // Récupérer tous les élèves
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            schoolId: true
          }
        }
      }
    })

    console.log(`📊 ${students.length} élève(s) à migrer\n`)

    let updated = 0
    for (const student of students) {
      if (student.user?.schoolId !== donBosco.id) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { schoolId: donBosco.id }
        })
        console.log(`✅ Migré: ${student.lastName} ${student.firstName} (${student.code})`)
        updated++
      } else {
        console.log(`⏭️  Déjà à Don Bosco: ${student.lastName} ${student.firstName}`)
      }
    }

    console.log(`\n🎉 Migration terminée: ${updated} élève(s) migré(s) vers "Collège Technique Don Bosco"`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateStudentsToSchool()
