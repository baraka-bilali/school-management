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
 * Thème partagé pour espaces élève / enseignant / staff.
 * useSyncExternalStore garantit que layout, sidebar et pages
 * restent synchronisés (plus de bascule Clair→Sombre obligatoire).
 */
export function useStudentTheme() {
  const theme = useSyncExternalStore(
    subscribeAppTheme,
    getAppTheme,
    getServerSnapshot
  )

  const toggleTheme = (newTheme: AppTheme) => {
    setAppTheme(newTheme)
  }

  const isDark = theme === "dark"

  return {
    theme,
    isDark,
    toggleTheme,
    bg: isDark ? "bg-gray-900" : "bg-[#eef2f9]",
    desktopBg: isDark ? "lg:bg-gray-900" : "lg:bg-[#eef2f9]",
    card: isDark ? "bg-gray-800 lg:bg-[#1c1c24]" : "bg-white",
    text: isDark ? "text-gray-100" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-700 lg:border-white/5" : "border-gray-100",
    shadow: isDark ? "shadow-none" : "shadow-sm shadow-gray-200/60",
    navBar: isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white",
    unreadHighlight: isDark ? "border-indigo-500/30 bg-indigo-500/10" : "border-indigo-200 bg-indigo-50",
    unreadHighlightSoft: isDark ? "border-indigo-500/20 bg-indigo-500/5" : "border-indigo-200 bg-indigo-50/50",
    actionBtn: isDark
      ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    tabHover: isDark ? "hover:bg-gray-800" : "hover:bg-gray-50",
    iconMutedBg: isDark ? "bg-gray-800" : "bg-gray-100",
    unreadIconBg: isDark ? "bg-indigo-500/20" : "bg-indigo-100",
    linkAccent: isDark ? "text-indigo-400" : "text-indigo-600",
  }
}
