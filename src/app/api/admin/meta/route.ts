import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [classes, years, current] = await prisma.$transaction([
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.academicYear.findMany({ orderBy: [{ current: "desc" }, { name: "desc" }] }),
    prisma.academicYear.findFirst({ where: { current: true } }),
  ])
  const hasCurrent = Boolean(current?.id)
  return NextResponse.json({ classes, years, currentYearId: hasCurrent ? current!.id : null })
}


