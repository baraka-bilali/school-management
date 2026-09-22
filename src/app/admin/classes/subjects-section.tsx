"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import { BookOpen, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/auth-fetch"
import { TableLoadingBlock } from "@/components/ui/table-loading"

interface Subject {
  id: number
  name: string
  code: string
  description: string | null
  color: string | null
  coefficient: number
  maxWeeklyHours: number
  groupLabel: string | null
}

export function SubjectsSection({ theme }: { theme: "light" | "dark" }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const isDark = theme === "dark"
  const textColor = isDark ? "text-gray-100" : "text-gray-800"
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600"
  const borderColor = isDark ? "border-gray-700" : "border-gray-200"
  const rowHover = isDark ? "hover:bg-gray-700/40" : "hover:bg-gray-50"

  const loadData = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) setLoading(true)
    try {
      const res = await authFetch("/api/admin/subjects")
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Chargement impossible")
      setSubjects(d.subjects || [])
      if (typeof d.purgedManual === "number" && d.purgedManual > 0) {
        toast.success(
          `${d.purgedManual} matière${d.purgedManual > 1 ? "s" : ""} manuelle${d.purgedManual > 1 ? "s" : ""} retirée${d.purgedManual > 1 ? "s" : ""} (hors bulletin)`
        )
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function syncCatalog() {
    setSyncing(true)
    try {
      const res = await authFetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensureCteb" }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "Synchronisation impossible")
      setSubjects(d.subjects || [])
      toast.success("Catalogue bulletin CTEB synchronisé")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Card theme={theme}>
        <CardHeader>
          <CardTitle className={textColor}>Matières / Cours</CardTitle>
        </CardHeader>
        <CardContent>
          <TableLoadingBlock textClassName={textSecondary} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card theme={theme}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle className={textColor}>Matières / Cours</CardTitle>
          <p className={cn("mt-1 text-xs", textSecondary)}>
            Uniquement les branches des bulletins officiels (CTEB 7ème–8ème). La
            création libre est désactivée. Primaire :{" "}
            <Link
              href="/admin/grades"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Notes &amp; Bulletins → Branches primaire
            </Link>
            . Humanités : catalogue à venir.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void syncCatalog()}
          disabled={syncing}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Synchroniser CTEB
        </button>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <div className={cn("rounded-xl border border-dashed py-12 text-center", borderColor)}>
            <BookOpen className={cn("mx-auto mb-3 h-10 w-10", textSecondary)} />
            <p className={cn("text-sm font-medium", textColor)}>Aucune matière bulletin</p>
            <p className={cn("mt-1 text-xs", textSecondary)}>
              Cliquez sur « Synchroniser CTEB » pour charger le catalogue officiel.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-2.5">
              {subjects.map((s) => (
                <div
                  key={`m-subj-${s.id}`}
                  className={cn("flex items-center gap-3 rounded-2xl border p-4", borderColor)}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: s.color || "#0369a1" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-[15px] font-semibold", textColor)}>
                      {s.name}
                    </div>
                    <div className={cn("mt-1 truncate text-xs", textSecondary)}>
                      {s.code}
                      {s.groupLabel ? ` · ${s.groupLabel}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-lg border border-inherit">
              <table className="w-full text-sm">
                <thead className={isDark ? "bg-gray-700/50" : "bg-gray-50"}>
                  <tr className={cn("border-b text-left", borderColor)}>
                    <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Matière</th>
                    <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Code</th>
                    <th className={cn("px-4 py-3 font-semibold", textSecondary)}>Groupe</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => (
                    <tr
                      key={s.id}
                      className={cn("border-b transition-colors", borderColor, rowHover)}
                    >
                      <td className={cn("px-4 py-3.5 font-medium", textColor)}>
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: s.color || "#0369a1" }}
                        />
                        {s.name}
                      </td>
                      <td className={cn("px-4 py-3.5 font-mono text-xs", textSecondary)}>
                        {s.code}
                      </td>
                      <td className={cn("px-4 py-3.5", textSecondary)}>
                        {s.groupLabel || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
