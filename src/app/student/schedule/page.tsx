"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Calendar, Clock } from "lucide-react"

export default function StudentSchedulePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) setTheme(newTheme)
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Horaire des cours</h1>
          <p className={textSecondary}>Consultez votre emploi du temps hebdomadaire</p>
        </div>

        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Emploi du temps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-12 ${textSecondary}`}>
              <Clock className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Fonctionnalité à venir</p>
              <p className="text-sm text-center max-w-md">
                L'emploi du temps sera bientôt disponible. Vous pourrez consulter 
                vos cours par jour et par semaine.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
