import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { FeeError } from "@/lib/fees"

const JWT_SECRET = process.env.JWT_SECRET || "secret_key"

export interface AuthUser {
  id: number
  role: string
  schoolId: number
}

/**
 * Extraire et vérifier l'utilisateur authentifié depuis le cookie JWT.
 * Retourne l'utilisateur ou lance une erreur.
 */
export function getAuthUser(req: NextRequest): AuthUser {
  const token = req.cookies.get("token")?.value
  if (!token) {
    throw new FeeError("Non authentifié", "UNAUTHORIZED", 401)
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      role: string
      schoolId?: number
    }

    if (!decoded.schoolId) {
      throw new FeeError("schoolId manquant dans le token", "NO_SCHOOL_ID", 403)
    }

    return {
      id: decoded.id,
      role: decoded.role,
      schoolId: decoded.schoolId,
    }
  } catch (error) {
    if (error instanceof FeeError) throw error
    throw new FeeError("Token invalide", "INVALID_TOKEN", 401)
  }
}

/**
 * Vérifier que l'utilisateur a un rôle autorisé.
 */
export function requireRole(user: AuthUser, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new FeeError(
      `Rôle ${user.role} non autorisé. Rôles acceptés: ${allowedRoles.join(", ")}`,
      "FORBIDDEN",
      403
    )
  }
}

/**
 * Gestion centralisée des erreurs pour les routes API.
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error)

  if (error instanceof FeeError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    // Erreur Zod
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: JSON.parse(error.message) },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: "Erreur interne du serveur" },
    { status: 500 }
  )
}
