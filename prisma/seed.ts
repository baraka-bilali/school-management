import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer des années académiques
  const currentYear = await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      current: true,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30')
    }
  })

  const previousYear = await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {},
    create: {
      name: '2023-2024',
      current: false,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30')
    }
  })

  console.log('✅ Années académiques créées')

  // Créer des classes selon le format RDC
  const classes = [
    // Primaire
    { level: '1ère', section: 'Primaire', letter: 'A', stream: null },
    { level: '1ère', section: 'Primaire', letter: 'B', stream: null },
    { level: '2ème', section: 'Primaire', letter: 'A', stream: null },
    { level: '2ème', section: 'Primaire', letter: 'B', stream: null },
    { level: '3ème', section: 'Primaire', letter: 'A', stream: null },
    { level: '4ème', section: 'Primaire', letter: 'A', stream: null },
    { level: '5ème', section: 'Primaire', letter: 'A', stream: null },
    { level: '6ème', section: 'Primaire', letter: 'A', stream: null },
    
    // Secondaire
    { level: '1ère', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '1ère', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    { level: '2ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '2ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    { level: '3ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '3ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    { level: '4ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '4ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    { level: '5ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '5ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    { level: '6ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '6ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire' },
    
    // Supérieur
    { level: '1ère', section: 'Supérieur', letter: 'A', stream: 'Technique' },
    { level: '2ème', section: 'Supérieur', letter: 'A', stream: 'Technique' },
    { level: '3ème', section: 'Supérieur', letter: 'A', stream: 'Technique' }
  ]

  for (const classData of classes) {
    const className = `${classData.level} ${classData.letter} ${classData.section}${classData.stream ? ` ${classData.stream}` : ''}`
    
    await prisma.class.upsert({
      where: { name: className },
      update: {},
      create: {
        name: className,
        level: classData.level,
        section: classData.section,
        letter: classData.letter,
        stream: classData.stream
      }
    })
  }

  console.log('✅ Classes créées')

  // Créer un utilisateur admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.local' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@school.local',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password: admin123
      role: 'ADMIN'
    }
  })

  console.log('✅ Utilisateur admin créé')

  // Créer un super admin (pour accéder à /super-admin)
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'super@school.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@school.local',
      // même hash que admin123 pour développement
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
      role: 'SUPER_ADMIN' as any
    }
  })

  console.log('✅ Super Admin créé (email: super@school.local / mot de passe: admin123)')

  console.log('🎉 Seeding terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
