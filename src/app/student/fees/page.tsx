"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Wallet, CreditCard, CheckCircle, AlertCircle } from "lucide-react"

export default function StudentFeesPage() {
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
          <h1 className={`text-2xl font-bold ${textColor}`}>Frais scolaires</h1>
          <p className={textSecondary}>Gérez vos paiements et consultez votre solde</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Total à payer</p>
                  <p className={`text-2xl font-bold ${textColor}`}>-- $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Montant payé</p>
                  <p className={`text-2xl font-bold ${textColor}`}>-- $</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card theme={theme}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Solde restant</p>
                  <p className={`text-2xl font-bold ${textColor}`}>-- $</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card theme={theme}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              Historique des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-col items-center justify-center py-12 ${textSecondary}`}>
              <Wallet className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Fonctionnalité à venir</p>
              <p className="text-sm text-center max-w-md">
                L'historique de vos paiements sera bientôt disponible. Vous pourrez 
                consulter vos reçus et suivre l'état de vos frais scolaires.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
