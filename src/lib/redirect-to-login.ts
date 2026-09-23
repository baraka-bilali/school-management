/** Une seule redirection même si plusieurs 401 arrivent en parallèle. */
let redirecting = false

export function redirectToLogin() {
  if (typeof window === "undefined") return
  if (redirecting) return
  const path = window.location.pathname
  if (path === "/login" || path === "/super-admin/login") return
  redirecting = true

  try {
    localStorage.removeItem("token")
  } catch {
    /* ignore */
  }
  document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"

  void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
    window.location.replace("/login")
  })
}

export function getStoredTokenExpiryMs(): number | null {
  if (typeof window === "undefined") return null
  try {
    const token = localStorage.getItem("token")
    if (!token) return null
    const parts = token.split(".")
    if (parts.length < 2) return null
    const json = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(json)) as { exp?: number }
    if (typeof payload.exp !== "number") return null
    return payload.exp * 1000
  } catch {
    return null
  }
}
