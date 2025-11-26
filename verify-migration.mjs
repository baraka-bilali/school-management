import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMigration() {
  try {
    console.log('🔍 Vérification finale de la migration...\n')
    
    const donBosco = await prisma.school.findFirst({
      where: { nomEtablissement: 'Collège Technique Don Bosco' }
    })

    if (!donBosco) {
      console.error('❌ École introuvable!')
      return
    }

    console.log(`✅ École: ${donBosco.nomEtablissement} (ID: ${donBosco.id})\n`)

    // Vérifier les élèves
    const allStudents = await prisma.student.findMany({
      include: {
        user: {
          select: {
            schoolId: true,
            school: {
              select: {
                nomEtablissement: true
              }
            }
          }
        }
      }
    })

    const donBoscoStudents = allStudents.filter(s => s.user?.schoolId === donBosco.id)
    const otherStudents = allStudents.filter(s => s.user?.schoolId !== donBosco.id)

    console.log(`👨‍🎓 ÉLÈVES:`)
    console.log(`   ✅ À Don Bosco: ${donBoscoStudents.length}/${allStudents.length}`)
    if (otherStudents.length > 0) {
      console.log(`   ⚠️  Autres écoles: ${otherStudents.length}`)
      otherStudents.forEach(s => {
        console.log(`      - ${s.lastName} ${s.firstName}: ${s.user?.school?.nomEtablissement || 'Aucune'}`)
      })
    }

    // Vérifier les enseignants
    const allTeachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            schoolId: true,
            school: {
              select: {
                nomEtablissement: true
              }
            }
          }
        }
      }
    })

    const donBoscoTeachers = allTeachers.filter(t => t.user?.schoolId === donBosco.id)
    const otherTeachers = allTeachers.filter(t => t.user?.schoolId !== donBosco.id)

    console.log(`\n👨‍🏫 ENSEIGNANTS:`)
    console.log(`   ✅ À Don Bosco: ${donBoscoTeachers.length}/${allTeachers.length}`)
    if (otherTeachers.length > 0) {
      console.log(`   ⚠️  Autres écoles: ${otherTeachers.length}`)
      otherTeachers.forEach(t => {
        console.log(`      - ${t.lastName} ${t.firstName}: ${t.user?.school?.nomEtablissement || 'Aucune'}`)
      })
    }

    // Vérifier les admins
    const allAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        schoolId: true,
        school: {
          select: {
            nomEtablissement: true
          }
        }
      }
    })

    const donBoscoAdmins = allAdmins.filter(a => a.schoolId === donBosco.id)
    const otherAdmins = allAdmins.filter(a => a.schoolId !== donBosco.id)

    console.log(`\n👔 ADMINISTRATEURS:`)
    console.log(`   ✅ À Don Bosco: ${donBoscoAdmins.length}/${allAdmins.length}`)
    if (otherAdmins.length > 0) {
      console.log(`   ⚠️  Autres écoles: ${otherAdmins.length}`)
      otherAdmins.forEach(a => {
        console.log(`      - ${a.email}: ${a.school?.nomEtablissement || 'Aucune'}`)
      })
    }

    if (donBoscoStudents.length === allStudents.length && 
        donBoscoTeachers.length === allTeachers.length && 
        donBoscoAdmins.length === allAdmins.length) {
      console.log('\n🎉 ✅ MIGRATION COMPLÈTE! Tous les utilisateurs appartiennent à "Collège Technique Don Bosco"')
    } else {
      console.log('\n⚠️  Il reste des utilisateurs à migrer')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
