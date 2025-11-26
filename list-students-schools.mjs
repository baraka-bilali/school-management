import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAllStudents() {
  try {
    console.log('📊 Liste de tous les élèves et leurs écoles:\n')
    
    const students = await prisma.student.findMany({
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
      },
      orderBy: { id: 'asc' }
    })

    console.log(`Total: ${students.length} élèves\n`)
    
    students.forEach(s => {
      console.log(`ID: ${s.id} | ${s.lastName} ${s.firstName} | Code: ${s.code} | École: ${s.user?.school?.nomEtablissement || 'AUCUNE (NULL)'} (School ID: ${s.user?.schoolId || 'NULL'})`)
    })

    // Compter par école
    console.log('\n📈 Répartition par école:')
    const schoolCounts = {}
    students.forEach(s => {
      const schoolName = s.user?.school?.nomEtablissement || 'AUCUNE'
      schoolCounts[schoolName] = (schoolCounts[schoolName] || 0) + 1
    })

    Object.entries(schoolCounts).forEach(([school, count]) => {
      console.log(`   ${school}: ${count} élève(s)`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllStudents()
