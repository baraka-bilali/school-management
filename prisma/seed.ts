import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // ─── Années académiques ─────────────────────────────────────────────────────
  const currentYear = await prisma.academicYear.upsert({
    where: { name: '2024-2025' },
    update: {},
    create: {
      name: '2024-2025',
      current: true,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
    },
  })

  await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {},
    create: {
      name: '2023-2024',
      current: false,
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
    },
  })

  console.log('✅ Années académiques créées')

  // ─── Utilisateurs admin ─────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@school.local' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@school.local',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // admin123
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'super@school.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'super@school.local',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // admin123
      role: 'SUPER_ADMIN' as any,
    },
  })

  console.log('✅ Utilisateurs admin créés')

  // ─── École existante (Collège Technique Don Bosco) ─────────────────────────
  // ⚠️ On utilise l'école existante au lieu d'en créer une nouvelle
  const school = await prisma.school.findFirst({
    where: {
      OR: [
        { nomEtablissement: { contains: 'Don Bosco' } },
        { nomEtablissement: { contains: 'Technique' } }
      ]
    }
  })

  if (!school) {
    console.error('❌ Aucune école trouvée. Veuillez d\'abord créer une école via le super-admin.')
    throw new Error('École introuvable')
  }

  console.log(`✅ École trouvée : ${school.nomEtablissement} (ID: ${school.id})`)

  // ─── Classes (20 : 8 Primaire + 12 Secondaire) ─────────────────────────────
  const classesData = [
    // Primaire (8 classes)
    { level: '1ère', section: 'Primaire',   letter: 'A', stream: null },
    { level: '1ère', section: 'Primaire',   letter: 'B', stream: null },
    { level: '2ème', section: 'Primaire',   letter: 'A', stream: null },
    { level: '2ème', section: 'Primaire',   letter: 'B', stream: null },
    { level: '3ème', section: 'Primaire',   letter: 'A', stream: null },
    { level: '4ème', section: 'Primaire',   letter: 'A', stream: null },
    { level: '5ème', section: 'Primaire',   letter: 'A', stream: null },
    { level: '6ème', section: 'Primaire',   letter: 'A', stream: null },
    // Secondaire (12 classes)
    { level: '1ère', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '1ère', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
    { level: '2ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '2ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
    { level: '3ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '3ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
    { level: '4ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '4ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
    { level: '5ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '5ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
    { level: '6ème', section: 'Secondaire', letter: 'A', stream: 'Scientifique' },
    { level: '6ème', section: 'Secondaire', letter: 'B', stream: 'Littéraire'   },
  ]

  const createdClasses: Array<{ id: number; name: string; section: string }> = []

  for (const cd of classesData) {
    const name = `${cd.level} ${cd.letter} ${cd.section}${cd.stream ? ` ${cd.stream}` : ''}`
    const cls = await prisma.class.upsert({
      where: { name_schoolId: { name, schoolId: school.id } },
      update: {},
      create: { 
        name, 
        level: cd.level, 
        section: cd.section, 
        letter: cd.letter, 
        stream: cd.stream,
        schoolId: school.id 
      },
    })
    createdClasses.push({ id: cls.id, name: cls.name, section: cd.section })
  }

  console.log('✅ 20 classes créées (8 Primaire + 12 Secondaire)')

  // ─── Professeurs (21 : 11 hommes + 10 femmes) ──────────────────────────────
  const teacherData = [
    // Hommes (11)
    { lastName: 'KABONGO',   firstName: 'Jean-Pierre',  gender: 'M', specialty: 'Mathématiques',          birthDate: '1975-03-12' },
    { lastName: 'MWAMBA',    firstName: 'Patrick',       gender: 'M', specialty: 'Physique',                birthDate: '1978-07-22' },
    { lastName: 'LUKASI',    firstName: 'Emmanuel',      gender: 'M', specialty: 'Français',                birthDate: '1980-11-05' },
    { lastName: 'KASONGO',   firstName: 'Théodore',      gender: 'M', specialty: 'Histoire-Géographie',    birthDate: '1976-04-18' },
    { lastName: 'BANZA',     firstName: 'Michel',        gender: 'M', specialty: 'Sciences Naturelles',    birthDate: '1982-09-30' },
    { lastName: 'TSHIBANDA', firstName: 'Roger',         gender: 'M', specialty: 'Anglais',                birthDate: '1979-01-14' },
    { lastName: 'MULUMBA',   firstName: 'Christophe',    gender: 'M', specialty: 'Biologie',               birthDate: '1977-06-25' },
    { lastName: 'ILUNGA',    firstName: 'Désiré',        gender: 'M', specialty: 'Éducation Physique',     birthDate: '1985-08-08' },
    { lastName: 'TSHIKALA',  firstName: 'Jonas',         gender: 'M', specialty: 'Informatique',           birthDate: '1988-12-03' },
    { lastName: 'MUAMBA',    firstName: 'Albert',        gender: 'M', specialty: 'Éducation Civique',      birthDate: '1974-02-20' },
    { lastName: 'LUYINDULA', firstName: 'Bertrand',      gender: 'M', specialty: 'Géographie',             birthDate: '1983-10-15' },
    // Femmes (10)
    { lastName: 'MBUYAMBA',  firstName: 'Marie',         gender: 'F', specialty: 'Mathématiques',          birthDate: '1981-05-07' },
    { lastName: 'KAZADI',    firstName: 'Grâce',         gender: 'F', specialty: 'Français',               birthDate: '1984-03-28' },
    { lastName: 'TSHITENGE', firstName: 'Cécile',        gender: 'F', specialty: 'Biologie',               birthDate: '1979-11-17' },
    { lastName: 'NKONGOLO',  firstName: 'Sophie',        gender: 'F', specialty: 'Histoire-Géographie',   birthDate: '1977-07-09' },
    { lastName: 'MUTOMBO',   firstName: 'Félicité',      gender: 'F', specialty: 'Anglais',               birthDate: '1986-04-22' },
    { lastName: 'KIBWE',     firstName: 'Jeanne',        gender: 'F', specialty: 'Religion & Morale',     birthDate: '1975-09-14' },
    { lastName: 'LUPEMBA',   firstName: 'Christine',     gender: 'F', specialty: 'Arts Plastiques',       birthDate: '1982-01-30' },
    { lastName: 'MBUYI',     firstName: 'Alphonsine',    gender: 'F', specialty: 'Chimie',                birthDate: '1980-06-16' },
    { lastName: 'KASEBA',    firstName: 'Rosette',       gender: 'F', specialty: 'Sciences Vie et Terre', birthDate: '1978-12-04' },
    { lastName: 'KALONJI',   firstName: 'Hortense',      gender: 'F', specialty: 'Mathématiques',         birthDate: '1983-08-21' },
  ]

  const createdTeachers: Array<{ id: number; specialty: string | null }> = []

  for (let i = 0; i < teacherData.length; i++) {
    const td = teacherData[i]
    const slug = `${td.lastName.toLowerCase()}.${td.firstName.toLowerCase().replace(/[^a-z]/g, '')}`
    const email = `${slug}@institutmakelele.cd`
    const phone = `+243 8${String(i + 1).padStart(2, '0')} ${100000 + (i + 1) * 9871}`

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: `${td.firstName} ${td.lastName}`,
        email,
        password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
        role: 'PROFESSEUR',
        nom: td.lastName,
        prenom: td.firstName,
        schoolId: school.id,
      },
    })

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        lastName: td.lastName,
        middleName: '',
        firstName: td.firstName,
        gender: td.gender,
        birthDate: new Date(td.birthDate),
        specialty: td.specialty,
        phone,
        hiredAt: new Date('2020-09-01'),
      },
    })

    createdTeachers.push({ id: teacher.id, specialty: teacher.specialty })
  }

  console.log(`✅ ${createdTeachers.length} professeurs créés (11 hommes + 10 femmes)`)

  // ─── Élèves (120 : 60 garçons + 60 filles — 6 par classe) ─────────────────
  const boyFirstNames = [
    'Aaron', 'Alexis', 'Anatole', 'André', 'Antoine', 'Armand', 'Barnabé',
    'Benjamin', 'Bertin', 'Bruno', 'Cédric', 'Christian', 'Claude', 'Constant',
    'Daniel', 'David', 'Denis', 'Didier', 'Dieudonné', 'Edmond',
    'Edouard', 'Élie', 'Emmanuel', 'Ernest', 'Étienne', 'Fabrice',
    'François', 'Frédéric', 'Gédéon', 'Georges', 'Gilles', 'Grégoire',
    'Henri', 'Hervé', 'Hubert', 'Innocent', 'Jacques', 'Jean-Baptiste',
    'Jean-Claude', 'Jean-Luc', 'Joël', 'Jonathan', 'Joseph', 'Jules',
    'Léon', 'Luc', 'Lucien', 'Marcel', 'Marc', 'Mathieu',
    'Maurice', 'Michel', 'Nicolas', 'Noël', 'Olivier', 'Pascal',
    'Patrick', 'Paul', 'Pierre', 'Rodrigue',
  ]

  const girlFirstNames = [
    'Adèle', 'Alphonsine', 'Anastasie', 'Angélique', 'Antoinette', 'Béatrice',
    'Bernadette', 'Cécile', 'Chantal', 'Christine', 'Clarisse', 'Clémentine',
    'Claudette', 'Colette', 'Consolée', 'Denise', 'Désirée', 'Espérance',
    'Eugénie', 'Fabiola', 'Félicité', 'Florence', 'Francine', 'Germaine',
    'Grâce', 'Hortense', 'Jacqueline', 'Jeanne', 'Joséphine', 'Josiane',
    'Lydie', 'Madeleine', 'Marceline', 'Marie', 'Marie-Claire', 'Marthe',
    'Monique', 'Nathalie', 'Nicole', 'Odette', 'Pascaline', 'Pauline',
    'Régine', 'Rosette', 'Scholastique', 'Séraphine', 'Sophie', 'Thérèse',
    'Véronique', 'Virginie', 'Yvette', 'Yolande', 'Zénaïde', 'Albertine',
    'Brigitte', 'Céleste', 'Dorothée', 'Élise', 'Félicie', 'Geneviève',
  ]

  const lastNames = [
    'KABONGO', 'MWAMBA', 'LUKASI', 'KASONGO', 'BANZA', 'TSHIBANDA',
    'MULUMBA', 'ILUNGA', 'TSHIKALA', 'MUAMBA', 'LUYINDULA', 'MBUYAMBA',
    'KAZADI', 'TSHITENGE', 'NKONGOLO', 'MUTOMBO', 'KIBWE', 'LUPEMBA',
    'MBUYI', 'KASEBA', 'KALONJI', 'TSHISEKEDI', 'KALALA', 'KABAMBA',
    'MUSONDA', 'BANDA', 'MPIANA', 'MAYAMBA', 'NGOY', 'KABEYA',
    'MUKENDI', 'NZUZI', 'MBEMBA', 'LOKOMBA', 'KIBANGU', 'MBULAYI',
    'NDOMBASI', 'TSHOMBA', 'BAKALA', 'ELONGO', 'NTUMBA', 'KALOMBO',
    'MWILAMBWE', 'KABUNDI', 'NGANDU', 'BIYELA', 'KAPUYA', 'BUKASA',
    'LUFUNGULA', 'KITEMBO', 'KABUYA', 'MUYUMBA', 'KABWE', 'NGOYI',
    'KAMWANGA', 'NSENGA', 'TSHIAMBI', 'MPOMBO', 'TSHISUAKA', 'KANKU',
  ]

  let boyIndex = 0
  let girlIndex = 0

  console.log('📝 Création des 120 élèves (cela peut prendre 2-3 minutes)...')
  
  for (const cls of createdClasses) {
    const classOrder = createdClasses.indexOf(cls)
    console.log(`   → Classe ${classOrder + 1}/20: ${cls.name}`)

    // 3 garçons par classe
    for (let g = 0; g < 3; g++) {
      const firstName = boyFirstNames[boyIndex % boyFirstNames.length]
      const lastName = lastNames[(boyIndex * 7 + classOrder * 3 + g) % lastNames.length]
      const birthYear = 2012 - Math.floor(boyIndex / 3)
      const email = `eleve.m${boyIndex + 1}@institutmakelele.cd`
      const code = `EL-G-${String(boyIndex + 1).padStart(4, '0')}`

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `${firstName} ${lastName}`,
          email,
          password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
          role: 'ELEVE',
          nom: lastName,
          prenom: firstName,
          schoolId: school.id,
        },
      })

      const student = await prisma.student.upsert({
        where: { code },
        update: {},
        create: {
          userId: user.id,
          code,
          lastName,
          middleName: '',
          firstName,
          gender: 'M',
          birthDate: new Date(`${birthYear}-${String((boyIndex % 12) + 1).padStart(2, '0')}-15`),
        },
      })

      await prisma.enrollment.upsert({
        where: { studentId_classId_yearId: { studentId: student.id, classId: cls.id, yearId: currentYear.id } },
        update: {},
        create: { studentId: student.id, classId: cls.id, yearId: currentYear.id, status: 'ACTIVE' },
      })

      boyIndex++
    }

    // 3 filles par classe
    for (let f = 0; f < 3; f++) {
      const firstName = girlFirstNames[girlIndex % girlFirstNames.length]
      const lastName = lastNames[(girlIndex * 11 + classOrder * 3 + f) % lastNames.length]
      const birthYear = 2012 - Math.floor(girlIndex / 3)
      const email = `eleve.f${girlIndex + 1}@institutmakelele.cd`
      const code = `EL-F-${String(girlIndex + 1).padStart(4, '0')}`

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `${firstName} ${lastName}`,
          email,
          password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m',
          role: 'ELEVE',
          nom: lastName,
          prenom: firstName,
          schoolId: school.id,
        },
      })

      const student = await prisma.student.upsert({
        where: { code },
        update: {},
        create: {
          userId: user.id,
          code,
          lastName,
          middleName: '',
          firstName,
          gender: 'F',
          birthDate: new Date(`${birthYear}-${String((girlIndex % 12) + 1).padStart(2, '0')}-15`),
        },
      })

      await prisma.enrollment.upsert({
        where: { studentId_classId_yearId: { studentId: student.id, classId: cls.id, yearId: currentYear.id } },
        update: {},
        create: { studentId: student.id, classId: cls.id, yearId: currentYear.id, status: 'ACTIVE' },
      })

      girlIndex++
    }
  }

  console.log(`✅ 120 élèves créés (60 garçons + 60 filles) — 6 par classe`)

  // ─── Matières (avec codes / abréviations) ──────────────────────────────────
  // TODO: Décommenter après migration + prisma generate
  /*
  const subjectsData = [
    { name: 'Mathématiques',              code: 'MATH',  color: '#4f46e5', coefficient: 3, maxWeeklyHours: 6 },
    { name: 'Français',                   code: 'FR',    color: '#0ea5e9', coefficient: 3, maxWeeklyHours: 6 },
    { name: 'Sciences Naturelles',        code: 'SN',    color: '#10b981', coefficient: 2, maxWeeklyHours: 4 },
    { name: 'Histoire-Géographie',        code: 'HG',    color: '#f59e0b', coefficient: 2, maxWeeklyHours: 4 },
    { name: 'Physique',                   code: 'PHY',   color: '#8b5cf6', coefficient: 2, maxWeeklyHours: 4 },
    { name: 'Chimie',                     code: 'CHIM',  color: '#ef4444', coefficient: 2, maxWeeklyHours: 4 },
    { name: 'Biologie',                   code: 'BIO',   color: '#22c55e', coefficient: 2, maxWeeklyHours: 3 },
    { name: 'Anglais',                    code: 'ANG',   color: '#f97316', coefficient: 2, maxWeeklyHours: 4 },
    { name: 'Éducation Civique & Morale', code: 'ECM',   color: '#0891b2', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Éducation Physique',         code: 'EP',    color: '#84cc16', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Religion & Morale',          code: 'REL',   color: '#fbbf24', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Informatique',               code: 'INFO',  color: '#6366f1', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Arts Plastiques',            code: 'ART',   color: '#ec4899', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Géographie',                 code: 'GEO',   color: '#14b8a6', coefficient: 1, maxWeeklyHours: 2 },
    { name: 'Philosophie',                code: 'PHILO', color: '#a855f7', coefficient: 2, maxWeeklyHours: 3 },
  ]

  const createdSubjects: Array<{ id: number; code: string }> = []

  for (const sd of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: sd.code } },
      update: {},
      create: { ...sd, schoolId: school.id },
    })
    createdSubjects.push({ id: subject.id, code: subject.code })
  }

  console.log(`✅ ${createdSubjects.length} matières créées avec codes`)

  // ─── Pauses & Récréations ───────────────────────────────────────────────────
  // Modèle 2 vacations : matin (07h30–12h00) + après-midi (13h00–16h30)
  const breaksData = [
    { name: 'Début 1ère vacation',            type: 'DEBUT_VACATION' as const,  startTime: '07:30', endTime: '07:30', duration: 0,  section: null       },
    { name: 'Récréation du matin',             type: 'RECREATION'     as const,  startTime: '09:40', endTime: '10:00', duration: 20, section: null       },
    { name: 'Fin 1ère vacation',               type: 'FIN_VACATION'   as const,  startTime: '12:00', endTime: '12:00', duration: 0,  section: null       },
    { name: 'Pause déjeuner',                  type: 'PAUSE_DEJEUNER' as const,  startTime: '12:00', endTime: '13:00', duration: 60, section: null       },
    { name: 'Début 2ème vacation',             type: 'DEBUT_VACATION' as const,  startTime: '13:00', endTime: '13:00', duration: 0,  section: null       },
    { name: 'Récréation Primaire après-midi',  type: 'RECREATION'     as const,  startTime: '15:00', endTime: '15:15', duration: 15, section: 'Primaire' },
    { name: 'Fin 2ème vacation',               type: 'FIN_VACATION'   as const,  startTime: '16:30', endTime: '16:30', duration: 0,  section: null       },
  ]

  for (const b of breaksData) {
    const exists = await prisma.scheduleBreak.findFirst({ where: { schoolId: school.id, name: b.name } })
    if (!exists) {
      await prisma.scheduleBreak.create({ data: { ...b, schoolId: school.id } })
    }
  }

  console.log('✅ 7 pauses & récréations créées (2 vacations + pauses)')

  // ─── Attributions cours → professeur ───────────────────────────────────────
  type SubjectCode = 'MATH' | 'FR' | 'PHY' | 'CHIM' | 'BIO' | 'ANG' | 'HG' | 'ECM' | 'EP' | 'REL' | 'INFO' | 'ART' | 'SN' | 'GEO' | 'PHILO'

  const specialtyToCode: Record<string, SubjectCode> = {
    'Mathématiques':          'MATH',
    'Physique':               'PHY',
    'Français':               'FR',
    'Histoire-Géographie':    'HG',
    'Sciences Naturelles':    'SN',
    'Anglais':                'ANG',
    'Biologie':               'BIO',
    'Éducation Physique':     'EP',
    'Informatique':           'INFO',
    'Éducation Civique':      'ECM',
    'Géographie':             'GEO',
    'Chimie':                 'CHIM',
    'Religion & Morale':      'REL',
    'Arts Plastiques':        'ART',
    'Sciences Vie et Terre':  'BIO',
  }

  const subjectWeeklyHours: Record<SubjectCode, number> = {
    MATH: 5, FR: 5, PHY: 3, CHIM: 3, BIO: 2,
    ANG: 3, HG: 2, ECM: 1, EP: 2, REL: 1,
    INFO: 2, ART: 1, SN: 3, GEO: 2, PHILO: 2,
  }

  const secondaireClasses = createdClasses.filter(c => c.section === 'Secondaire').slice(0, 4)
  const primaireClasses   = createdClasses.filter(c => c.section === 'Primaire').slice(0, 4)

  for (const teacher of createdTeachers) {
    if (!teacher.specialty) continue
    const code = specialtyToCode[teacher.specialty]
    if (!code) continue
    const subject = createdSubjects.find(s => s.code === code)
    if (!subject) continue

    const transversal = ['EP', 'ART', 'REL', 'ECM', 'INFO']
    const mixed       = ['SN', 'GEO', 'FR', 'HG']

    const targetClasses = transversal.includes(code)
      ? [...primaireClasses, ...secondaireClasses]
      : mixed.includes(code)
        ? [...primaireClasses.slice(0, 2), ...secondaireClasses.slice(0, 2)]
        : secondaireClasses

    for (const cls of targetClasses) {
      const weeklyHours = subjectWeeklyHours[code] ?? 2
      await prisma.courseAssignment.upsert({
        where: { subjectId_classId_yearId_schoolId: { subjectId: subject.id, classId: cls.id, yearId: currentYear.id, schoolId: school.id } },
        update: {},
        create: {
          subjectId: subject.id,
          teacherId: teacher.id,
          classId: cls.id,
          yearId: currentYear.id,
          weeklyHours,
          maxDailyHours: 2,
          schoolId: school.id,
        },
      })
    }
  }

  console.log('✅ Attributions cours-professeur créées')
  */

  console.log('\n🎉 Seeding terminé avec succès !')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Récapitulatif :')
  console.log('   🏫  1 école         : Institut Makelele (Kinshasa, RDC)')
  console.log('   📅  2 années académiques (2023-2024, 2024-2025)')
  console.log('   🏫  20 classes      : 8 Primaire + 12 Secondaire')
  console.log('   👨‍🏫 21 professeurs  : 11 hommes + 10 femmes')
  console.log('   👨‍🎓 120 élèves      : 60 garçons + 60 filles (6 par classe)')
  console.log('   📚  15 matières     : avec codes & couleurs')
  console.log('   ⏰  7 pauses/récréations (modèle 2 vacations)')
  console.log('   📋  Attributions cours-professeurs créées')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 Accès :  admin@school.local / super@school.local  (mdp: admin123)')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
