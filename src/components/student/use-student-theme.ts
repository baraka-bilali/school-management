"use client"

import { useEffect, useState } from "react"

export function useStudentTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  )

  useEffect(() => {
    const apply = (t: "light" | "dark") => {
      setTheme(t)
      document.documentElement.classList.toggle("dark", t === "dark")
    }

    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    apply(saved || "light")

    const handleChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) apply(t)
    }

    window.addEventListener("themeChange", handleChange)
    window.addEventListener("storage", handleChange)
    return () => {
      window.removeEventListener("themeChange", handleChange)
      window.removeEventListener("storage", handleChange)
    }
  }, [])

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    window.dispatchEvent(new Event("themeChange"))
  }

  const isDark = theme === "dark"

  return {
    theme,
    isDark,
    toggleTheme,
    bg: isDark ? "bg-gray-950" : "bg-[#eef2f9]",
    desktopBg: isDark ? "lg:bg-[#0a0a12]" : "lg:bg-[#eef2f9]",
    card: isDark ? "bg-gray-900 lg:bg-[#1c1c24]" : "bg-white",
    text: isDark ? "text-gray-100" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-800 lg:border-white/5" : "border-gray-100",
    shadow: isDark ? "shadow-none" : "shadow-sm shadow-gray-200/60",
    navBar: isDark ? "border-gray-800 bg-gray-950/95" : "border-gray-100 bg-white/95",
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
