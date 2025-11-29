"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Settings, User, Lock, Bell, Palette, Check } from "lucide-react"

export default function StudentSettingsPage() {
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

  const handleThemeToggle = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
    window.dispatchEvent(new Event("themeChange"))
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const cardBg = theme === "dark" ? "bg-gray-800" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className={`text-2xl font-bold ${textColor}`}>Paramètres</h1>
          <p className={textSecondary}>Gérez vos préférences et votre compte</p>
        </div>

        {/* Apparence */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-500" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className={`text-sm ${textSecondary}`}>Choisissez le thème de l'interface</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleThemeToggle("light")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "light"
                      ? "border-indigo-500 bg-indigo-50"
                      : `${borderColor} ${cardBg} hover:border-gray-400`
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm"></div>
                    {theme === "light" && <Check className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <p className={`font-medium ${theme === "light" ? "text-indigo-700" : textColor}`}>Clair</p>
                </button>
                
                <button
                  onClick={() => handleThemeToggle("dark")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    theme === "dark"
                      ? "border-indigo-500 bg-indigo-500/10"
                      : `${borderColor} ${cardBg} hover:border-gray-400`
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg"></div>
                    {theme === "dark" && <Check className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <p className={`font-medium ${theme === "dark" ? "text-indigo-400" : textColor}`}>Sombre</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profil */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-8 ${textSecondary}`}>
              <User className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm text-center">
                La modification du profil sera bientôt disponible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-8 ${textSecondary}`}>
              <Lock className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm text-center">
                Le changement de mot de passe sera bientôt disponible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-8 ${textSecondary}`}>
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm text-center">
                Les préférences de notifications seront bientôt disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
