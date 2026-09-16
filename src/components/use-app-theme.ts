"use client"

import { useSyncExternalStore } from "react"
import {
  getAppTheme,
  setAppTheme,
  subscribeAppTheme,
  type AppTheme,
} from "@/lib/theme-store"

function getServerSnapshot(): AppTheme {
  return "light"
}

/**
 * Hook thème générique (admin / super-admin / tout écran hors shell élève).
 * Même store que useStudentTheme — layout et pages restent synchronisés.
 */
export function useAppTheme() {
  const theme = useSyncExternalStore(
    subscribeAppTheme,
    getAppTheme,
    getServerSnapshot
  )

  const isDark = theme === "dark"

  const setTheme = (next: AppTheme) => {
    setAppTheme(next)
  }

  const toggleTheme = (next?: AppTheme) => {
    setAppTheme(next ?? (theme === "dark" ? "light" : "dark"))
  }

  return { theme, isDark, setTheme, toggleTheme }
}
