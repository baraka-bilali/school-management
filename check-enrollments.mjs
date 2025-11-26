import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStudentEnrollments() {
  try {
    console.log('🔍 Vérification des inscriptions des étudiants...\n')
    
    // Récupérer toutes les classes
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`📚 ${classes.length} classes trouvées:`)
    for (const cls of classes) {
      console.log(`   - ID: ${cls.id}, Nom: ${cls.name}`)
    }
    
    console.log('\n📅 Années académiques:')
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' }
    })
    
    for (const year of years) {
      console.log(`   - ID: ${year.id}, Nom: ${year.name}, Actuelle: ${year.current}`)
    }
    
    // Compter les inscriptions par classe
    console.log('\n👥 Inscriptions par classe:')
    for (const cls of classes) {
      const enrollmentCount = await prisma.enrollment.count({
        where: { classId: cls.id }
      })
      console.log(`   - ${cls.name}: ${enrollmentCount} élève(s)`)
      
      if (enrollmentCount > 0) {
        const enrollments = await prisma.enrollment.findMany({
          where: { classId: cls.id },
          include: {
            student: true,
            year: true
          },
          take: 3
        })
        
        enrollments.forEach(e => {
          console.log(`      * ${e.student.lastName} ${e.student.firstName} (Année: ${e.year.name})`)
        })
        if (enrollmentCount > 3) {
          console.log(`      ... et ${enrollmentCount - 3} autre(s)`)
        }
      }
    }
    
    // Vérifier s'il y a des étudiants sans inscription
    const studentsWithoutEnrollment = await prisma.student.count({
      where: {
        enrollments: {
          none: {}
        }
      }
    })
    
    if (studentsWithoutEnrollment > 0) {
      console.log(`\n⚠️  ${studentsWithoutEnrollment} élève(s) sans inscription trouvés!`)
      const students = await prisma.student.findMany({
        where: {
          enrollments: {
            none: {}
          }
        },
        take: 5
      })
      
      console.log('Exemples:')
      students.forEach(s => {
        console.log(`   - ${s.lastName} ${s.firstName} (Code: ${s.code})`)
      })
    }
    
    console.log('\n✅ Vérification terminée!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStudentEnrollments()
