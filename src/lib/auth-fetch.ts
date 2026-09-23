import { redirectToLogin } from "@/lib/redirect-to-login"

/**
 * Wrapper pour fetch qui gère automatiquement les erreurs d'authentification
 * Redirige vers /login si le token est expiré (401)
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  if (response.status === 401) {
    redirectToLogin()
    throw new Error("Session expirée")
  }

  return response
}
