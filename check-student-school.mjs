import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStudent() {
  try {
    console.log('🔍 Vérification de l\'élève ID 6...\n')
    
    const student = await prisma.student.findUnique({
      where: { id: 6 },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            schoolId: true,
            school: {
              select: {
                id: true,
                nomEtablissement: true
              }
            }
          }
        },
        enrollments: {
          include: {
            class: true,
            year: true
          }
        }
      }
    })

    if (!student) {
      console.log('❌ Élève avec ID 6 introuvable!')
      return
    }

    console.log('📋 Informations de l\'élève:')
    console.log(`   - ID: ${student.id}`)
    console.log(`   - Nom: ${student.lastName} ${student.middleName} ${student.firstName}`)
    console.log(`   - Code: ${student.code}`)
    console.log(`   - User ID: ${student.userId}`)
    console.log(`   - School ID du user: ${student.user?.schoolId || 'NULL'}`)
    console.log(`   - École: ${student.user?.school?.nomEtablissement || 'Aucune école'}`)
    
    console.log('\n📚 Inscriptions:')
    if (student.enrollments.length > 0) {
      student.enrollments.forEach(e => {
        console.log(`   - Classe: ${e.class.name}, Année: ${e.year.name}`)
      })
    } else {
      console.log('   Aucune inscription')
    }

    // Vérifier tous les admins et leurs schoolId
    console.log('\n👥 Administrateurs:')
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            nomEtablissement: true
          }
        }
      }
    })

    admins.forEach(admin => {
      console.log(`   - ${admin.email} (ID: ${admin.id}, School ID: ${admin.schoolId || 'NULL'}, École: ${admin.school?.nomEtablissement || 'Aucune'})`)
    })

    // Vérifier toutes les écoles
    console.log('\n🏫 Écoles dans la base:')
    const schools = await prisma.school.findMany()
    schools.forEach(school => {
      console.log(`   - ID: ${school.id}, Nom: ${school.nomEtablissement}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStudent()
