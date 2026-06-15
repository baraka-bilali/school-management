"use client"

import { useEffect, useState } from "react"

export function useStudentTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    if (saved) setTheme(saved)

    const handleChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
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
    card: isDark ? "bg-gray-900" : "bg-white",
    text: isDark ? "text-gray-100" : "text-gray-900",
    textMuted: isDark ? "text-gray-400" : "text-gray-500",
    border: isDark ? "border-gray-800" : "border-gray-100",
    shadow: isDark ? "shadow-none" : "shadow-sm shadow-gray-200/60",
  }
}
