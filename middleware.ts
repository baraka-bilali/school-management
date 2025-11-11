import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secret_key")

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as any
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("token")?.value
  const payload = token ? await verifyToken(token) : null
  const role = payload?.role as string | undefined

  const isSuperAdminArea = pathname.startsWith("/super-admin")
  const isSuperAdminLogin = pathname === "/super-admin/login"
  const isAdminArea = pathname.startsWith("/admin")
  const isGeneralLogin = pathname === "/login"
  const isRegister = pathname === "/register"

  const adminAllowed = new Set([
    "ADMIN",
    "COMPTABLE",
    "DIRECTEUR_DISCIPLINE",
    "DIRECTEUR_ETUDES",
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
    if (!role || (!adminAllowed.has(role) && role !== "ADMIN")) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  // General login: if already logged in, push to respective area
  if (isGeneralLogin && role) {
    const url = req.nextUrl.clone()
    url.pathname = role === "SUPER_ADMIN" ? "/super-admin" : "/admin"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/login",
    "/super-admin/login",
    "/register",
  ],
}
