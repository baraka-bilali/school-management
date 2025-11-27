/**
 * Wrapper pour fetch qui gère automatiquement les erreurs d'authentification
 * Redirige vers /login si le token est expiré (401)
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  // Si le serveur retourne 401, la session est expirée
  if (response.status === 401) {
    // Nettoyer le cookie token
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    
    // Rediriger vers la page de login
    window.location.href = "/login"
    
    // Lancer une erreur pour arrêter l'exécution
    throw new Error("Session expirée")
  }

  return response
}
