import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixStudentSchoolId() {
  try {
    console.log('🔍 Vérification des étudiants sans schoolId...')
    
    // Récupérer tous les étudiants dont le user n'a pas de schoolId
    const studentsWithoutSchool = await prisma.student.findMany({
      where: {
        user: {
          schoolId: null
        }
      },
      include: {
        user: true
      }
    })

    console.log(`📊 Trouvé ${studentsWithoutSchool.length} étudiants sans schoolId`)

    if (studentsWithoutSchool.length === 0) {
      console.log('✅ Tous les étudiants ont déjà un schoolId assigné!')
      return
    }

    // Récupérer l'école par défaut (première école dans la base)
    const defaultSchool = await prisma.school.findFirst()

    if (!defaultSchool) {
      console.error('❌ Aucune école trouvée dans la base de données!')
      console.log('Veuillez d\'abord créer une école.')
      return
    }

    console.log(`🏫 École par défaut: ${defaultSchool.nomEtablissement} (ID: ${defaultSchool.id})`)
    console.log(`📝 Mise à jour de ${studentsWithoutSchool.length} étudiants...`)

    // Mettre à jour tous les users des étudiants avec le schoolId
    let updated = 0
    for (const student of studentsWithoutSchool) {
      await prisma.user.update({
        where: { id: student.userId },
        data: { schoolId: defaultSchool.id }
      })
      updated++
      if (updated % 10 === 0) {
        console.log(`   ⏳ ${updated}/${studentsWithoutSchool.length} étudiants mis à jour...`)
      }
    }

    console.log(`✅ ${updated} étudiants ont été associés à l'école ${defaultSchool.nomEtablissement}`)
    console.log('🎉 Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStudentSchoolId()
