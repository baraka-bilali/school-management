"use client"

import { useEffect, useState, useCallback } from "react"
import Layout from "@/components/layout"
import {
  Settings2,
  BadgeDollarSign,
  CheckCircle2,
  Calendar,
  Plus,
  BookOpen,
  Loader2,
  CheckCircle,
  Star,
} from "lucide-react"

interface AcademicYear {
  id: number
  name: string
  startDate: string | null
  endDate: string | null
  _count: {
    enrollments: number
    tarifications: number
  }
}

interface SchoolSettings {
  currency: "USD" | "CDF"
  exchangeRate: number
  currentYearId: number | null
}

export default function SettingsPage() {
  // ---- Settings state ----
  const [settings, setSettings] = useState<SchoolSettings>({
    currency: "USD",
    exchangeRate: 2800,
    currentYearId: null,
  })
  const [form, setForm] = useState<SchoolSettings>({
    currency: "USD",
    exchangeRate: 2800,
    currentYearId: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // ---- Academic years state ----
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loadingYears, setLoadingYears] = useState(true)

  // ---- New year form ----
  const [showNewYearForm, setShowNewYearForm] = useState(false)
  const [newYearName, setNewYearName] = useState("")
  const [newYearStart, setNewYearStart] = useState("")
  const [newYearEnd, setNewYearEnd] = useState("")
  const [creatingYear, setCreatingYear] = useState(false)
  const [yearError, setYearError] = useState("")

  // ---- Theme ----
  const [theme, setTheme] = useState<"light" | "dark">("light")
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
    const handleThemeChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("themeChange", handleThemeChange)
    return () => window.removeEventListener("themeChange", handleThemeChange)
  }, [])

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const inputBg = theme === "dark"
    ? "bg-gray-700 border-gray-600 text-gray-100"
    : "bg-white border-gray-300 text-gray-900"

  // ---- Load settings ----
  const loadSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data: SchoolSettings = await res.json()
        setSettings(data)
        setForm(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSettings(false)
    }
  }, [])

  // ---- Load academic years ----
  const loadYears = useCallback(async () => {
    setLoadingYears(true)
    try {
      const res = await fetch("/api/admin/academic-years")
      if (res.ok) {
        const { data } = await res.json()
        setYears(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingYears(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    loadYears()
  }, [loadSettings, loadYears])

  // ---- Save settings ----
  const handleSave = async () => {
    const rate = Number(form.exchangeRate)
    if (Number.isNaN(rate) || rate <= 0) return

    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data: SchoolSettings = await res.json()
        setSettings(data)
        setForm(data)
        localStorage.setItem("schoolCurrency", data.currency)
        localStorage.setItem("schoolExchangeRate", String(data.exchangeRate))
        window.dispatchEvent(new Event("schoolSettingsChange"))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // ---- Create academic year ----
  const handleCreateYear = async () => {
    const name = newYearName.trim()
    if (!name) {
      setYearError("Le nom est requis (ex: 2025-2026)")
      return
    }
    setYearError("")
    setCreatingYear(true)
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate: newYearStart || null,
          endDate: newYearEnd || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setYearError(data.error || "Erreur lors de la création")
        return
      }
      setYears((prev) => [{ ...data.data, _count: { enrollments: 0, tarifications: 0 } }, ...prev])
      setNewYearName("")
      setNewYearStart("")
      setNewYearEnd("")
      setShowNewYearForm(false)
    } catch (e) {
      console.error(e)
      setYearError("Erreur serveur")
    } finally {
      setCreatingYear(false)
    }
  }

  // ---- Select year as current ----
  const handleSelectYear = async (yearId: number) => {
    const updated = { ...form, currentYearId: yearId }
    setForm(updated)
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        const data: SchoolSettings = await res.json()
        setSettings(data)
        setForm(data)
        localStorage.setItem("schoolCurrentYearId", String(data.currentYearId))
        window.dispatchEvent(new Event("schoolSettingsChange"))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const parsedRate = Number(form.exchangeRate || "0")
  const currentYear = years.find((y) => y.id === settings.currentYearId)

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-400">Configuration générale de l&apos;application.</p>
        </div>

        {/* ===== DEVISE ===== */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BadgeDollarSign className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Devise et taux de change</h2>
          </div>

          {loadingSettings ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className={`text-sm ${textSecondary}`}>Chargement...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Devise principale */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <label className={`text-sm font-medium ${textColor} block mb-2`}>
                    Devise principale
                  </label>
                  <div className="flex gap-3">
                    {(["USD", "CDF"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((prev) => ({ ...prev, currency: c }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.currency === c
                            ? "border-blue-500 bg-blue-500 text-white shadow-md"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {c === "USD" ? "🇺🇸 USD – Dollar" : "🇨🇩 CDF – Franc"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Taux de conversion */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <label htmlFor="exchangeRate" className={`text-sm font-medium ${textColor} block mb-2`}>
                    Taux de conversion USD → CDF
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${textSecondary} whitespace-nowrap`}>1 USD =</span>
                    <input
                      id="exchangeRate"
                      type="number"
                      min="1"
                      step="1"
                      value={form.exchangeRate}
                      onChange={(e) => setForm((prev) => ({ ...prev, exchangeRate: Number(e.target.value) }))}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                      placeholder="Ex: 2800"
                    />
                    <span className={`text-sm ${textSecondary}`}>CDF</span>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-2`}>
                    Exemple : si 1$ = 2 800 francs, entrez 2800.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <BadgeDollarSign className="w-4 h-4" />
                  {form.currency === "USD"
                    ? "Les montants seront affichés en dollars américains (USD)."
                    : `1$ = ${Number.isFinite(parsedRate) && parsedRate > 0 ? new Intl.NumberFormat("fr-FR").format(parsedRate) : "--"} FC — les montants seront convertis en francs congolais.`}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
                {saved && (
                  <span className="text-sm text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Paramètres enregistrés
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===== ANNÉE SCOLAIRE ===== */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Année scolaire en cours</h2>
            </div>
            <button
              onClick={() => { setShowNewYearForm((v) => !v); setYearError("") }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle année
            </button>
          </div>

          {/* Année courante sélectionnée */}
          {currentYear ? (
            <div className="mb-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-3 flex items-center gap-3">
              <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
              <div>
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                  Année active : {currentYear.name}
                </p>
                <p className={`text-xs ${textSecondary}`}>
                  {currentYear._count.enrollments} inscription(s) · {currentYear._count.tarifications} tarification(s)
                </p>
              </div>
            </div>
          ) : !loadingYears && (
            <div className="mb-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-3">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Aucune année scolaire sélectionnée. Choisissez-en une ci-dessous.
              </p>
            </div>
          )}

          {/* Formulaire nouvelle année */}
          {showNewYearForm && (
            <div className="mb-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-4 space-y-3">
              <h3 className={`text-sm font-semibold ${textColor}`}>Créer une nouvelle année scolaire</h3>
              <div>
                <label className={`text-xs font-medium ${textSecondary} block mb-1`}>Nom (ex : 2025-2026) *</label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="2025-2026"
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${inputBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-medium ${textSecondary} block mb-1`}>Date de début</label>
                  <input
                    type="date"
                    value={newYearStart}
                    onChange={(e) => setNewYearStart(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium ${textSecondary} block mb-1`}>Date de fin</label>
                  <input
                    type="date"
                    value={newYearEnd}
                    onChange={(e) => setNewYearEnd(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 ${inputBg}`}
                  />
                </div>
              </div>
              {yearError && <p className="text-sm text-red-500">{yearError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateYear}
                  disabled={creatingYear}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {creatingYear && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
                <button
                  onClick={() => { setShowNewYearForm(false); setYearError("") }}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des années */}
          {loadingYears ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <span className={`text-sm ${textSecondary}`}>Chargement...</span>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className={`w-10 h-10 mx-auto mb-2 ${textSecondary} opacity-40`} />
              <p className={`text-sm ${textSecondary}`}>Aucune année scolaire. Créez-en une.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {years.map((year) => {
                const isCurrent = year.id === settings.currentYearId
                return (
                  <div
                    key={year.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                      isCurrent
                        ? "border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${isCurrent ? "text-purple-700 dark:text-purple-300" : textColor}`}>
                          {year.name}
                          {isCurrent && <span className="ml-2 text-xs font-normal text-purple-500">● Active</span>}
                        </p>
                        <p className={`text-xs ${textSecondary}`}>
                          {year._count.enrollments} élève(s) inscrit(s) · {year._count.tarifications} tarification(s)
                        </p>
                        {(year.startDate || year.endDate) && (
                          <p className={`text-xs ${textSecondary} mt-0.5`}>
                            {year.startDate ? new Date(year.startDate).toLocaleDateString("fr-FR") : "?"} →{" "}
                            {year.endDate ? new Date(year.endDate).toLocaleDateString("fr-FR") : "?"}
                          </p>
                        )}
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300">
                        <CheckCircle className="w-3.5 h-3.5" />
                        En cours
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSelectYear(year.id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Définir comme active
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 p-3">
            <p className={`text-xs ${textSecondary}`}>
              <Settings2 className="w-3.5 h-3.5 inline mr-1" />
              L&apos;année active détermine quelles données sont affichées dans tout le tableau de bord : élèves, frais, notes, emplois du temps, etc.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

