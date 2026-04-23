"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Settings2, BadgeDollarSign, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
  const [usdToCdfRate, setUsdToCdfRate] = useState("2800")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedRate = localStorage.getItem("usdToCdfRate")
    if (storedRate) setUsdToCdfRate(storedRate)
  }, [])

  const handleSave = () => {
    const value = Number(usdToCdfRate)
    if (Number.isNaN(value) || value <= 0) return

    localStorage.setItem("usdToCdfRate", String(value))
    window.dispatchEvent(new Event("exchangeRateChange"))

    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const parsedRate = Number(usdToCdfRate || "0")

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Parametres</h1>
          <p className="text-gray-600 dark:text-gray-400">Configuration generale de l&apos;application.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Devise et taux de change</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Devise principale</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">USD (Dollar americain)</p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label htmlFor="usdToCdfRate" className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-2">
                Taux de conversion USD vers CDF
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">1 USD =</span>
                <input
                  id="usdToCdfRate"
                  type="number"
                  min="1"
                  step="1"
                  value={usdToCdfRate}
                  onChange={(e) => setUsdToCdfRate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 2800"
                />
                <span className="text-sm text-gray-500">CDF</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Exemple: si 1$ vaut 2 800 francs congolais, entrez 2800.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4" />
              1$ vaut actuellement {Number.isFinite(parsedRate) && parsedRate > 0 ? new Intl.NumberFormat("fr-FR").format(parsedRate) : "--"} francs congolais.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Enregistrer
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Taux enregistre avec succes
              </span>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}


