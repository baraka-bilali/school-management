/**
 * Store thème partagé (light/dark).
 * Évite les états React désynchronisés entre layout, sidebar et pages
 * qui appelaient chacune useStudentTheme() avec son propre useState.
 */

export type AppTheme = "light" | "dark"

type Listener = (theme: AppTheme) => void

const listeners = new Set<Listener>()

function readInitialClientTheme(): AppTheme {
  try {
    const saved = localStorage.getItem("theme")
    if (saved === "dark" || saved === "light") return saved
  } catch {
    /* ignore */
  }
  try {
    if (document.documentElement.classList.contains("dark")) return "dark"
  } catch {
    /* ignore */
  }
  return "light"
}

function applyToDom(theme: AppTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme === "dark" ? "dark" : "light"
}

let currentTheme: AppTheme = "light"

// Hydratation synchrone côté client (le script inline du layout a déjà posé la classe)
if (typeof window !== "undefined") {
  currentTheme = readInitialClientTheme()
  // Rester aligné si un autre écran (admin, etc.) change le thème via themeChange
  window.addEventListener("themeChange", () => {
    const next = readInitialClientTheme()
    if (next === currentTheme) return
    currentTheme = next
    applyToDom(next)
    listeners.forEach((listener) => listener(next))
  })
}

/** Snapshot courant — pur, sans effet de bord (requis par useSyncExternalStore). */
export function getAppTheme(): AppTheme {
  return currentTheme
}

export function subscribeAppTheme(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setAppTheme(theme: AppTheme) {
  if (currentTheme === theme) {
    // Réappliquer le DOM au cas où il serait désynchronisé
    if (typeof document !== "undefined") applyToDom(theme)
    return
  }
  currentTheme = theme
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("theme", theme)
    } catch {
      /* ignore */
    }
    applyToDom(theme)
    listeners.forEach((listener) => listener(theme))
    window.dispatchEvent(new Event("themeChange"))
  } else {
    listeners.forEach((listener) => listener(theme))
  }
}
