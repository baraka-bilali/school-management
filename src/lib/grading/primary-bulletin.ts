import { prisma } from "@/lib/prisma"
import { normalizePeriodResult, roundGrade } from "@/lib/grading/normalize"
import { primaryDegreeCodeForLevel } from "@/lib/grading/primary-maxima"
import { toDisplayCode } from "@/lib/student-fields"

export type BulletinSchoolInfo = {
  schoolName: string
  schoolAddress: string | null
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

export type BulletinStudentPayload = {
  enrollmentId: number
  studentId: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  fullName: string
  lines: BulletinBranchLine[]
  totalObtained: number
  totalMax: number
  percentage: number | null
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

/**
 * Charge les données de bulletins primaire pour une classe + événement.
 * Si enrollmentId est fourni, ne retourne que cet élève.
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

  const [enrollments, assignments, curriculumBranches] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        classId,
        yearId,
        status: "ACTIVE",
        ...(enrollmentFilter ? { id: enrollmentFilter } : {}),
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

  if (kind === "PERIOD" && periodId) {
    const subjectIds = assignments.map((a) => a.subjectId)
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
      branchRows.push({
        subjectId: a.subjectId,
        assignmentId: a.id,
        name: meta?.name || a.subject.name,
        domainName: meta?.domainName || "Autres",
        groupName: meta?.groupName ?? null,
        sortKey: meta?.sortKey || `9999|9999|9999|${a.subject.name}`,
        maxPoints: maxBySubject.get(a.subjectId) ?? 0,
      })
    }
  } else if (kind === "EXAM" && periodGroupId) {
    const subjectIds = assignments.map((a) => a.subjectId)
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
      branchRows.push({
        subjectId: a.subjectId,
        assignmentId: a.id,
        name: meta?.name || a.subject.name,
        domainName: meta?.domainName || "Autres",
        groupName: meta?.groupName ?? null,
        sortKey: meta?.sortKey || `9999|9999|9999|${a.subject.name}`,
        maxPoints: maxBySubject.get(a.subjectId) ?? 0,
      })
    }
  }

  branchRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey, "fr"))

  const assignmentIds = branchRows.map((b) => b.assignmentId)
  const enrollmentIds = enrollments.map((e) => e.id)

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
      for (const enr of enrollments) {
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

  const students: BulletinStudentPayload[] = enrollments.map((enr) => {
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
      lastName: enr.student.lastName,
      middleName: enr.student.middleName,
      firstName: enr.student.firstName,
      fullName: displayName(enr.student),
      lines,
      totalObtained: roundGrade(totalObtained),
      totalMax: roundGrade(totalMax),
      percentage,
    }
  })

  return {
    school: {
      schoolName: school?.nomEtablissement ?? "",
      schoolAddress:
        [school?.adresse, school?.ville].filter(Boolean).join(", ") || null,
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
