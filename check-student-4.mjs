import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStudent4() {
  const student = await prisma.student.findUnique({
    where: { id: 4 },
    include: {
      user: {
        select: {
          id: true,
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

  if (student) {
    console.log(`Élève ID 4: ${student.lastName} ${student.firstName}`)
    console.log(`User ID: ${student.user?.id}`)
    console.log(`School ID: ${student.user?.schoolId}`)
    console.log(`École: ${student.user?.school?.nomEtablissement}`)
  } else {
    console.log('Élève ID 4 introuvable')
  }

  await prisma.$disconnect()
}

checkStudent4()
