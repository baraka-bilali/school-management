"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/layout"
import { StudentsSection } from "../users/page"

export default function InscriptionsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const role = data?.user?.role
        const canEnroll = data?.user?.canEnrollStudents
        if (role === "CAISSIER" && !canEnroll) {
          setAllowed(false)
          router.replace("/admin/fees")
          return
        }
        if (role === "CAISSIER" || role === "ADMIN" || role === "DIRECTEUR_ETUDES") {
          setAllowed(true)
        } else {
          setAllowed(false)
          router.replace("/admin")
        }
      })
      .catch(() => {
        setAllowed(false)
        router.replace("/admin/fees")
      })

    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [router])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"

  if (allowed === null) {
    return (
      <Layout>
        <div className="p-6 text-center text-gray-500">Chargement...</div>
      </Layout>
    )
  }

  if (!allowed) return null

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Inscription</h1>
          <p className={textSecondary}>Enregistrement des nouveaux élèves</p>
        </div>
        <StudentsSection theme={theme} enrollmentOnly />
      </div>
    </Layout>
  )
}
