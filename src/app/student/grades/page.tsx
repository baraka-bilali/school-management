"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { FileText, TrendingUp, Award } from "lucide-react"

export default function StudentGradesPage() {
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
          <h1 className={`text-2xl font-bold ${textColor}`}>Notes & Bulletins</h1>
          <p className={textSecondary}>Consultez vos résultats scolaires et bulletins</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Moyenne générale</p>
                  <p className={`text-2xl font-bold ${textColor}`}>--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Matières</p>
                  <p className={`text-2xl font-bold ${textColor}`}>--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Rang</p>
                  <p className={`text-2xl font-bold ${textColor}`}>--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Mes notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-12 ${textSecondary}`}>
              <Award className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Fonctionnalité à venir</p>
              <p className="text-sm text-center max-w-md">
                Vos notes et bulletins seront bientôt disponibles ici. Vous pourrez 
                consulter vos résultats par matière et télécharger vos bulletins.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
