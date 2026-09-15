import { prisma } from "@/lib/prisma"
import { normalizePeriodResult, roundGrade } from "@/lib/grading/normalize"
import { primaryDegreeCodeForLevel } from "@/lib/grading/primary-maxima"
import { toDisplayCode } from "@/lib/student-fields"

export type BulletinSchoolInfo = {
  schoolName: string
  schoolAddress: string | null
  schoolCity: string | null
  schoolPhone: string | null
  schoolEmail: string | null
  logoUrl: string | null
  sealUrl: string | null
  slogan: string | null
}

export type BulletinBranchLine = {
  subjectId: number
  name: string
  domainName: string
  groupName: string | null
  obtained: number | null
  maxPoints: number
}

export type BulletinDomainSubtotal = {
  domainName: string
  obtained: number
  maxPoints: number
  percentage: number | null
  hasScore: boolean
}

export type BulletinStudentPayload = {
  enrollmentId: number
  studentId: number
  code: string
  permanentCode: string
  lastName: string
  middleName: string
  firstName: string
  fullName: string
  gender: string
  birthDate: string | null
  birthPlace: string | null
  lines: BulletinBranchLine[]
  domainSubtotals: BulletinDomainSubtotal[]
  /** Maxima généraux = somme des maxima des branches */
  totalObtained: number
  totalMax: number
  percentage: number | null
  /** Rang dans la classe pour l'événement (1 = premier) */
  place: number | null
  /** Application / conduite : non saisis encore — cases prévues */
  application: string | null
  conduite: string | null
}

export type PrimaryBulletinPayload = {
  school: BulletinSchoolInfo
  yearName: string
  event: {
    kind: "PERIOD" | "EXAM"
    periodId: number | null
    periodGroupId: number | null
    label: string
    groupName: string
  }
  class: {
    id: number
    name: string
    level: string
    letter: string
    titulaireName: string | null
  }
  /** Effectif de la classe (élèves actifs) */
  studentCount: number
  students: BulletinStudentPayload[]
}

function displayName(parts: {
  lastName: string
  middleName: string
  firstName: string
}): string {
  return [parts.lastName, parts.middleName, parts.firstName]
    .filter(Boolean)
    .join(" ")
    .trim()
}

function titulaireName(t: {
  lastName: string
  middleName: string
  firstName: string
} | null): string | null {
  if (!t) return null
  return displayName(t) || null
}

function buildDomainSubtotals(lines: BulletinBranchLine[]): BulletinDomainSubtotal[] {
  const map = new Map<
    string,
    { obtained: number; maxPoints: number; hasScore: boolean }
  >()
  for (const line of lines) {
    const cur = map.get(line.domainName) || {
      obtained: 0,
      maxPoints: 0,
      hasScore: false,
    }
    cur.maxPoints += line.maxPoints
    if (line.obtained != null) {
      cur.obtained += line.obtained
      cur.hasScore = true
    }
    map.set(line.domainName, cur)
  }
  return [...map.entries()].map(([domainName, v]) => ({
    domainName,
    obtained: roundGrade(v.obtained),
    maxPoints: roundGrade(v.maxPoints),
    percentage:
      v.hasScore && v.maxPoints > 0
        ? roundGrade((v.obtained / v.maxPoints) * 100, 1)
        : null,
    hasScore: v.hasScore,
  }))
}

/** Rang dense : 1,2,2,4… sur le pourcentage (nulls en dernier). */
function assignPlaces(
  rows: Array<{ enrollmentId: number; percentage: number | null }>
): Map<number, number | null> {
  const ranked = [...rows].sort((a, b) => {
    if (a.percentage == null && b.percentage == null) return 0
    if (a.percentage == null) return 1
    if (b.percentage == null) return -1
    return b.percentage - a.percentage
  })
  const places = new Map<number, number | null>()
  let lastPct: number | null = null
  let lastPlace = 0
  ranked.forEach((row, i) => {
    if (row.percentage == null) {
      places.set(row.enrollmentId, null)
      return
    }
    if (lastPct === null || row.percentage !== lastPct) {
      lastPlace = i + 1
      lastPct = row.percentage
    }
    places.set(row.enrollmentId, lastPlace)
  })
  return places
}

/**
 * Charge les données de bulletins primaire pour une classe + événement.
 * Si enrollmentId est fourni, ne retourne que cet élève (le rang est
 * calculé sur toute la classe).
 */
export async function loadPrimaryBulletins(params: {
  schoolId: number
  yearId: number
  classId: number
  kind: "PERIOD" | "EXAM"
  periodId?: number | null
  periodGroupId?: number | null
  enrollmentId?: number | null
}): Promise<PrimaryBulletinPayload> {
  const { schoolId, yearId, classId, kind } = params
  const periodId = kind === "PERIOD" ? params.periodId ?? null : null
  const periodGroupId = kind === "EXAM" ? params.periodGroupId ?? null : null
  const enrollmentFilter = params.enrollmentId ?? null

  const [school, year, cls] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        nomEtablissement: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        logoUrl: true,
        sealUrl: true,
        slogan: true,
      },
    }),
    prisma.academicYear.findUnique({
      where: { id: yearId },
      select: { name: true },
    }),
    prisma.class.findFirst({
      where: { id: classId, schoolId, section: "Primaire" },
      include: {
        titulaireTeacher: {
          select: { lastName: true, middleName: true, firstName: true },
        },
      },
    }),
  ])

  if (!cls) {
    throw new Error("Classe introuvable")
  }
  if (!year) {
    throw new Error("Année scolaire introuvable")
  }

  let eventLabel = ""
  let groupName = ""
  if (kind === "PERIOD" && periodId) {
    const period = await prisma.period.findFirst({
      where: { id: periodId, periodGroup: { cycle: { schoolId } } },
      include: { periodGroup: { select: { id: true, name: true } } },
    })
    if (!period) throw new Error("Période introuvable")
    eventLabel = period.name
    groupName = period.periodGroup.name
  } else if (kind === "EXAM" && periodGroupId) {
    const group = await prisma.periodGroup.findFirst({
      where: { id: periodGroupId, cycle: { schoolId } },
      select: { id: true, name: true },
    })
    if (!group) throw new Error("Trimestre introuvable")
    eventLabel = `Examen — ${group.name}`
    groupName = group.name
  } else {
    throw new Error("Événement d'évaluation invalide")
  }

  const degreeCode = primaryDegreeCodeForLevel(cls.level)

  // Toujours charger toute la classe pour calculer la place / l'effectif
  const [allEnrollments, assignments, curriculumBranches] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        classId,
        yearId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            permanentCode: true,
            lastName: true,
            middleName: true,
            firstName: true,
            gender: true,
            birthDate: true,
            birthPlace: true,
          },
        },
      },
      orderBy: [
        { student: { lastName: "asc" } },
        { student: { middleName: "asc" } },
        { student: { firstName: "asc" } },
      ],
    }),
    prisma.courseAssignment.findMany({
      where: {
        schoolId,
        yearId,
        classId,
        isActive: true,
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
    }),
    degreeCode
      ? prisma.primaryBranch.findMany({
          where: {
            isActive: true,
            subjectId: { not: null },
            domain: {
              degree: { schoolId, code: degreeCode, isActive: true },
            },
          },
          include: {
            domain: { select: { name: true, sortOrder: true } },
            group: { select: { name: true, sortOrder: true } },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ])

  const branchMetaBySubject = new Map<
    number,
    { name: string; domainName: string; groupName: string | null; sortKey: string }
  >()
  for (const b of curriculumBranches) {
    if (!b.subjectId) continue
    if (!branchMetaBySubject.has(b.subjectId)) {
      branchMetaBySubject.set(b.subjectId, {
        name: b.name,
        domainName: b.domain.name,
        groupName: b.group?.name ?? null,
        sortKey: [
          String(b.domain.sortOrder).padStart(4, "0"),
          String(b.group?.sortOrder ?? 999).padStart(4, "0"),
          String(b.sortOrder).padStart(4, "0"),
          b.name,
        ].join("|"),
      })
    }
  }

  type BranchRow = {
    subjectId: number
    assignmentId: number
    name: string
    domainName: string
    groupName: string | null
    sortKey: string
    maxPoints: number
  }

  const branchRows: BranchRow[] = []
  const subjectIds = assignments.map((a) => a.subjectId)

  if (kind === "PERIOD" && periodId) {
    const maxima = await prisma.subjectPeriodMax.findMany({
      where: {
        subjectId: { in: subjectIds },
        section: "Primaire",
        level: cls.level,
        stream: "",
        periodId,
      },
    })
    const maxBySubject = new Map(maxima.map((m) => [m.subjectId, m.maxPoints]))

    for (const a of assignments) {
      const meta = branchMetaBySubject.get(a.subjectId)
      // Préférer max curriculum (maxPeriode) si SubjectPeriodMax manquant
      const curriculumMax =
        curriculumBranches.find((b) => b.subjectId === a.subjectId)?.maxPeriode
      branchRows.push({
        subjectId: a.subjectId,
        assignmentId: a.id,
        name: meta?.name || a.subject.name,
        domainName: meta?.domainName || "Autres",
        groupName: meta?.groupName ?? null,
        sortKey: meta?.sortKey || `9999|9999|9999|${a.subject.name}`,
        maxPoints: maxBySubject.get(a.subjectId) ?? curriculumMax ?? 0,
      })
    }
  } else if (kind === "EXAM" && periodGroupId) {
    const maxima = await prisma.subjectExamMax.findMany({
      where: {
        subjectId: { in: subjectIds },
        section: "Primaire",
        level: cls.level,
        stream: "",
        periodGroupId,
      },
    })
    const maxBySubject = new Map(maxima.map((m) => [m.subjectId, m.maxPoints]))

    for (const a of assignments) {
      const meta = branchMetaBySubject.get(a.subjectId)
      const curriculumMax = curriculumBranches.find(
        (b) => b.subjectId === a.subjectId
      )
      const examMax =
        curriculumMax != null ? curriculumMax.maxPeriode * 2 : undefined
      branchRows.push({
        subjectId: a.subjectId,
        assignmentId: a.id,
        name: meta?.name || a.subject.name,
        domainName: meta?.domainName || "Autres",
        groupName: meta?.groupName ?? null,
        sortKey: meta?.sortKey || `9999|9999|9999|${a.subject.name}`,
        maxPoints: maxBySubject.get(a.subjectId) ?? examMax ?? 0,
      })
    }
  }

  branchRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "fr"))

  const assignmentIds = branchRows.map((b) => b.assignmentId)
  const enrollmentIds = allEnrollments.map((e) => e.id)

  const scoresByAssignmentEnrollment = new Map<string, number | null>()

  if (kind === "PERIOD" && periodId && assignmentIds.length > 0) {
    const columns = await prisma.evaluationColumn.findMany({
      where: {
        courseAssignmentId: { in: assignmentIds },
        periodId,
      },
      include: {
        grades: {
          where: enrollmentIds.length
            ? { enrollmentId: { in: enrollmentIds } }
            : undefined,
        },
      },
    })

    const colsByAssignment = new Map<number, typeof columns>()
    for (const col of columns) {
      const list = colsByAssignment.get(col.courseAssignmentId) || []
      list.push(col)
      colsByAssignment.set(col.courseAssignmentId, list)
    }

    for (const branch of branchRows) {
      const cols = colsByAssignment.get(branch.assignmentId) || []
      const sumColumnMax = cols.reduce((s, c) => s + c.maxPoints, 0)
      for (const enr of allEnrollments) {
        let sumObtained = 0
        let hasAny = false
        for (const col of cols) {
          const g = col.grades.find((x) => x.enrollmentId === enr.id)
          if (g) {
            sumObtained += g.pointsObtained
            hasAny = true
          }
        }
        const key = `${branch.assignmentId}:${enr.id}`
        if (!hasAny || branch.maxPoints <= 0 || sumColumnMax <= 0) {
          scoresByAssignmentEnrollment.set(key, null)
        } else {
          const n = normalizePeriodResult({
            sumObtained,
            sumColumnMax,
            officialMax: branch.maxPoints,
          })
          scoresByAssignmentEnrollment.set(key, n == null ? null : roundGrade(n))
        }
      }
    }
  } else if (kind === "EXAM" && periodGroupId && assignmentIds.length > 0) {
    const examGrades = await prisma.examGrade.findMany({
      where: {
        courseAssignmentId: { in: assignmentIds },
        periodGroupId,
        ...(enrollmentIds.length ? { enrollmentId: { in: enrollmentIds } } : {}),
      },
    })
    for (const g of examGrades) {
      scoresByAssignmentEnrollment.set(
        `${g.courseAssignmentId}:${g.enrollmentId}`,
        roundGrade(g.pointsObtained)
      )
    }
  }

  const builtAll = allEnrollments.map((enr) => {
    const lines: BulletinBranchLine[] = branchRows.map((b) => {
      const obtained =
        scoresByAssignmentEnrollment.get(`${b.assignmentId}:${enr.id}`) ?? null
      return {
        subjectId: b.subjectId,
        name: b.name,
        domainName: b.domainName,
        groupName: b.groupName,
        obtained,
        maxPoints: b.maxPoints,
      }
    })

    let totalObtained = 0
    let totalMax = 0
    let hasScore = false
    for (const line of lines) {
      totalMax += line.maxPoints
      if (line.obtained != null) {
        totalObtained += line.obtained
        hasScore = true
      }
    }

    const percentage =
      hasScore && totalMax > 0
        ? roundGrade((totalObtained / totalMax) * 100, 1)
        : null

    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      code:
        toDisplayCode(enr.code) || toDisplayCode(enr.student.permanentCode) || "",
      permanentCode: enr.student.permanentCode,
      lastName: enr.student.lastName,
      middleName: enr.student.middleName,
      firstName: enr.student.firstName,
      fullName: displayName(enr.student),
      gender: enr.student.gender,
      birthDate: enr.student.birthDate
        ? enr.student.birthDate.toISOString().slice(0, 10)
        : null,
      birthPlace: enr.student.birthPlace,
      lines,
      domainSubtotals: buildDomainSubtotals(lines),
      totalObtained: roundGrade(totalObtained),
      totalMax: roundGrade(totalMax),
      percentage,
      place: null as number | null,
      application: null as string | null,
      conduite: null as string | null,
    }
  })

  const places = assignPlaces(
    builtAll.map((s) => ({
      enrollmentId: s.enrollmentId,
      percentage: s.percentage,
    }))
  )
  for (const s of builtAll) {
    s.place = places.get(s.enrollmentId) ?? null
  }

  const students = enrollmentFilter
    ? builtAll.filter((s) => s.enrollmentId === enrollmentFilter)
    : builtAll

  return {
    school: {
      schoolName: school?.nomEtablissement ?? "",
      schoolAddress: school?.adresse ?? null,
      schoolCity: school?.ville ?? null,
      schoolPhone: school?.telephone ?? null,
      schoolEmail: school?.email ?? null,
      logoUrl: school?.logoUrl ?? null,
      sealUrl: school?.sealUrl ?? null,
      slogan: school?.slogan ?? null,
    },
    yearName: year.name,
    event: {
      kind,
      periodId: kind === "PERIOD" ? periodId : null,
      periodGroupId: kind === "EXAM" ? periodGroupId : null,
      label: eventLabel,
      groupName,
    },
    class: {
      id: cls.id,
      name: cls.name,
      level: cls.level,
      letter: cls.letter,
      titulaireName: titulaireName(cls.titulaireTeacher),
    },
    studentCount: allEnrollments.length,
    students,
  }
}

export type ClassStudentOption = {
  enrollmentId: number
  studentId: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  fullName: string
}

/** Liste alphabétique des élèves actifs d'une classe (année courante). */
export async function loadClassStudentsAlpha(params: {
  schoolId: number
  yearId: number
  classId: number
}): Promise<ClassStudentOption[]> {
  const cls = await prisma.class.findFirst({
    where: {
      id: params.classId,
      schoolId: params.schoolId,
      section: "Primaire",
    },
    select: { id: true },
  })
  if (!cls) throw new Error("Classe introuvable")

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: params.classId,
      yearId: params.yearId,
      status: "ACTIVE",
    },
    include: {
      student: {
        select: {
          id: true,
          permanentCode: true,
          lastName: true,
          middleName: true,
          firstName: true,
        },
      },
    },
    orderBy: [
      { student: { lastName: "asc" } },
      { student: { middleName: "asc" } },
      { student: { firstName: "asc" } },
    ],
  })

  return enrollments.map((enr) => ({
    enrollmentId: enr.id,
    studentId: enr.student.id,
    code:
      toDisplayCode(enr.code) || toDisplayCode(enr.student.permanentCode) || "",
    lastName: enr.student.lastName,
    middleName: enr.student.middleName,
    firstName: enr.student.firstName,
    fullName: displayName(enr.student),
  }))
}
