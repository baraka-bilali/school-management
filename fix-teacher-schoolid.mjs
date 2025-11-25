import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTeacherSchoolId() {
  try {
    console.log('🔍 Vérification des enseignants sans schoolId...')
    
    // Récupérer tous les enseignants dont le user n'a pas de schoolId
    const teachersWithoutSchool = await prisma.teacher.findMany({
      where: {
        user: {
          schoolId: null
        }
      },
      include: {
        user: true
      }
    })

    console.log(`📊 Trouvé ${teachersWithoutSchool.length} enseignants sans schoolId`)

    if (teachersWithoutSchool.length === 0) {
      console.log('✅ Tous les enseignants ont déjà un schoolId assigné!')
      return
    }

    // Récupérer l'école par défaut (première école dans la base)
    const defaultSchool = await prisma.school.findFirst()

    if (!defaultSchool) {
      console.error('❌ Aucune école trouvée dans la base de données!')
      return
    }

    console.log(`🏫 École par défaut: ${defaultSchool.nomEtablissement} (ID: ${defaultSchool.id})`)
    console.log(`📝 Mise à jour de ${teachersWithoutSchool.length} enseignants...`)

    // Mettre à jour tous les users des enseignants avec le schoolId
    let updated = 0
    for (const teacher of teachersWithoutSchool) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { schoolId: defaultSchool.id }
      })
      updated++
      if (updated % 10 === 0) {
        console.log(`   ⏳ ${updated}/${teachersWithoutSchool.length} enseignants mis à jour...`)
      }
    }

    console.log(`✅ ${updated} enseignants ont été associés à l'école ${defaultSchool.nomEtablissement}`)
    console.log('🎉 Migration terminée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTeacherSchoolId()
