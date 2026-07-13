import { NextRequest, NextResponse } from "next/server"
import { getStaffFromRequest } from "@/lib/staff-auth"
import { prisma } from "@/lib/prisma"
import { getSchoolCurrentYearId } from "@/lib/fees/school-year"

export async function GET(req: NextRequest) {
  const ctx = await getStaffFromRequest(req)
  if (!ctx) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const yearId = ctx.yearId ?? (await getSchoolCurrentYearId(ctx.schoolId))

  const [year, latestCommunique] = await Promise.all([
    yearId
      ? prisma.academicYear.findUnique({
          where: { id: yearId },
          select: { name: true, startDate: true, endDate: true },
        })
      : Promise.resolve(null),
    yearId
      ? prisma.communique.findFirst({
          where: { schoolId: ctx.schoolId, yearId },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, createdAt: true },
        })
      : Promise.resolve(null),
  ])

  const calendarEvents: Array<{ date: string; label: string; type: "year" | "communique" }> = []
  if (year?.startDate) {
    calendarEvents.push({
      date: year.startDate.toISOString(),
      label: "Début de l'année scolaire",
      type: "year",
    })
  }
  if (year?.endDate) {
    calendarEvents.push({
      date: year.endDate.toISOString(),
      label: "Fin de l'année scolaire",
      type: "year",
    })
  }
  if (latestCommunique) {
    calendarEvents.push({
      date: new Date(latestCommunique.createdAt).toISOString(),
      label: latestCommunique.title,
      type: "communique",
    })
  }

  return NextResponse.json({
    yearName: year?.name ?? null,
    yearStart: year?.startDate?.toISOString() ?? null,
    yearEnd: year?.endDate?.toISOString() ?? null,
    latestCommunique,
    calendarEvents,
  })
}
