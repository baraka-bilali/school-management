import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret_key")

import { isStaffPortalRole } from "@/lib/staff-roles"

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as any
  } catch {
    return null
  }
}

function redirectForRole(req: NextRequest, role: string) {
  const url = req.nextUrl.clone()
  if (role === "SUPER_ADMIN") {
    url.pathname = "/super-admin"
  } else if (role === "ELEVE") {
    url.pathname = "/student"
  } else if (role === "PROFESSEUR") {
    url.pathname = "/teacher"
  } else if (role === "PARENT") {
    url.pathname = "/parent"
  } else if (role === "CAISSIER") {
    url.pathname = "/admin/fees"
  } else if (isStaffPortalRole(role)) {
    url.pathname = "/staff"
  } else if (role === "ADMIN") {
    url.pathname = "/admin"
  } else {
    url.pathname = "/login"
  }
  return NextResponse.redirect(url)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("token")?.value
  const payload = token ? await verifyToken(token) : null
  const role = payload?.role as string | undefined

  const isSuperAdminArea = pathname.startsWith("/super-admin")
  const isSuperAdminLogin = pathname === "/super-admin/login"
  const isAdminArea = pathname.startsWith("/admin")
  const isStudentArea = pathname.startsWith("/student")
  const isTeacherArea = pathname.startsWith("/teacher")
  const isStaffArea = pathname.startsWith("/staff")
  const isParentArea = pathname.startsWith("/parent")
  const isGeneralLogin = pathname === "/login"
  const isRegister = pathname === "/register"

  // Rôles avec accès admin (gestion). Les autres personnels n'accèdent qu'à /staff.
  const adminAllowed = new Set([
    "ADMIN",
    "COMPTABLE",
    "CAISSIER",
    "DIRECTEUR_DISCIPLINE",
    "DIRECTEUR_ETUDES",
    "DIRECTEUR_ADJOINT",
  ])

  // Block public access to /register entirely
  if (isRegister) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Super Admin space protection
  if (isSuperAdminArea && !isSuperAdminLogin) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/super-admin/login"
      return NextResponse.redirect(url)
    }
    if (role !== "SUPER_ADMIN") {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  // Super Admin login: if already authenticated as SUPER_ADMIN, go to dashboard
  if (isSuperAdminLogin && role === "SUPER_ADMIN") {
    const url = req.nextUrl.clone()
    url.pathname = "/super-admin"
    return NextResponse.redirect(url)
  }

  // Admin space protection for non-super roles
  if (isAdminArea) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (role === "SUPER_ADMIN") {
      const url = req.nextUrl.clone()
      url.pathname = "/super-admin"
      return NextResponse.redirect(url)
    }
    if (!adminAllowed.has(role)) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    // Caissier : accès limité à la caisse et aux inscriptions (permission vérifiée côté page/API)
    if (role === "CAISSIER") {
      const allowed =
        pathname.startsWith("/admin/fees") ||
        pathname.startsWith("/admin/inscriptions") ||
        pathname.startsWith("/admin/salary")
      if (!allowed) {
        const url = req.nextUrl.clone()
        url.pathname = "/admin/fees"
        return NextResponse.redirect(url)
      }
    }
  }

  // Student space protection
  if (isStudentArea) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (role !== "ELEVE") {
      return redirectForRole(req, role)
    }
  }

  // Teacher space protection
  if (isTeacherArea) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (role !== "PROFESSEUR") {
      return redirectForRole(req, role)
    }
  }

  // Staff space protection
  if (isStaffArea) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (!isStaffPortalRole(role)) {
      return redirectForRole(req, role)
    }
  }

  // Parent space protection
  if (isParentArea) {
    if (!role) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (role !== "PARENT") {
      return redirectForRole(req, role)
    }
  }

  // General login: if already logged in, push to respective area
  if (isGeneralLogin && role) {
    if (role === "SUPER_ADMIN") {
      const url = req.nextUrl.clone()
      url.pathname = "/super-admin"
      return NextResponse.redirect(url)
    }
    if (role === "ELEVE") {
      const url = req.nextUrl.clone()
      url.pathname = "/student"
      return NextResponse.redirect(url)
    }
    if (role === "PROFESSEUR") {
      const url = req.nextUrl.clone()
      url.pathname = "/teacher"
      return NextResponse.redirect(url)
    }
    if (role === "PARENT") {
      const url = req.nextUrl.clone()
      url.pathname = "/parent"
      return NextResponse.redirect(url)
    }
    if (role === "CAISSIER") {
      const url = req.nextUrl.clone()
      url.pathname = "/admin/fees"
      return NextResponse.redirect(url)
    }
    if (isStaffPortalRole(role)) {
      const url = req.nextUrl.clone()
      url.pathname = "/staff"
      return NextResponse.redirect(url)
    }
    const url = req.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/staff/:path*",
    "/parent/:path*",
    "/login",
    "/super-admin/login",
    "/register",
  ],
}
