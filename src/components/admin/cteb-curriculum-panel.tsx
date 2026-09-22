"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react"

type BranchRow = {
  code: string
  name: string
  maxPeriode: number
  maxima: {
    maxPeriode: number
    maxExamen: number
    maxSemestre: number
    maxAnnuel: number
  }
}

type DomainRow = {
  name: string
  maxPeriodeSubtotal: number
  groups: Array<{
    name: string
    maxPeriodeSubtotal: number
    branches: BranchRow[]
  }>
  branches: BranchRow[]
}

type DegreeRow = {
  code: string
  name: string
  levels: string[]
  maxPeriodeTotal: number
  maxima: {
    maxPeriode: number
    maxExamen: number
    maxSemestre: number
    maxAnnuel: number
  }
  domains: DomainRow[]
  branchCount: number
}

export function CtebCurriculumPanel() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [degrees, setDegrees] = useState<DegreeRow[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/admin/cteb-curriculum")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Chargement impossible")
      const list = (data.degrees || []) as DegreeRow[]
      setDegrees(list)
      setSelectedCode((prev) => prev ?? (list[0]?.code ?? null))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = degrees.find((d) => d.code === selectedCode) || null

  useEffect(() => {
    if (!selected) return
    const next: Record<string, boolean> = {}
    for (const domain of selected.domains) next[domain.name] = true
    setOpenDomains(next)
  }, [selected?.code]) // eslint-disable-line react-hooks/exhaustive-deps

  async function syncCatalog() {
    setSyncing(true)
    try {
      const res = await authFetch("/api/admin/cteb-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Synchronisation impossible")
      setDegrees(data.degrees || [])
      toast.success(
        "Catalogue CTEB synchronisé (matières + maxima). Assignez les enseignants via Matières / Cours."
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement du catalogue EB…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Branches <strong>7ème / 8ème CTEB</strong> (Domaines → Groupes → Branches).
          Max période → examen×2 · semestre×4 · annuel×8. Chaque cours est assigné à un
          (ou plusieurs) enseignant(s) via <strong>Matières / Cours</strong> — pas de
          titulaire unique comme au primaire. Repêchage saisi par matière en fin d&apos;année.
        </p>
        <button
          type="button"
          onClick={() => void syncCatalog()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Synchroniser le catalogue
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {degrees.map((d) => {
          const active = selectedCode === d.code
          return (
            <button
              key={d.code}
              type="button"
              onClick={() => setSelectedCode(d.code)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-cyan-800 bg-cyan-800 text-white"
                  : "hover:bg-muted border-border"
              }`}
            >
              <div className="text-xs opacity-80">{d.name}</div>
              <div className="text-sm font-semibold mt-0.5">
                {d.levels.join(" · ")}
              </div>
              <div
                className={`text-xs mt-1 ${
                  active ? "text-cyan-100" : "text-muted-foreground"
                }`}
              >
                max période {d.maxPeriodeTotal} · {d.branchCount} branches
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="space-y-4">
          <div className="rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-muted/30">
            <div>
              <h2 className="font-semibold text-base">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">
                Niveaux : <strong>{selected.levels.join(", ")}</strong>
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Maxima généraux → période {selected.maxima.maxPeriode} · examen{" "}
              {selected.maxima.maxExamen} · semestre {selected.maxima.maxSemestre}{" "}
              · annuel {selected.maxima.maxAnnuel}
            </div>
          </div>

          {selected.domains.map((domain) => {
            const open = openDomains[domain.name] !== false
            return (
              <div key={domain.name} className="rounded-xl border overflow-hidden">
                <button
                  type="button"
                  className="w-full bg-muted/50 px-4 py-2.5 flex items-center justify-between gap-2 text-left"
                  onClick={() =>
                    setOpenDomains((prev) => ({
                      ...prev,
                      [domain.name]: !open,
                    }))
                  }
                >
                  <span className="font-semibold text-sm inline-flex items-center gap-2">
                    {open ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {domain.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sous-total période : {domain.maxPeriodeSubtotal}
                  </span>
                </button>
                {open && (
                  <div className="divide-y">
                    {domain.groups.map((group) => (
                      <div key={group.name} className="p-3 space-y-2">
                        <div className="text-sm font-medium flex justify-between">
                          <span>{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.maxPeriodeSubtotal}
                          </span>
                        </div>
                        {group.branches.map((b) => (
                          <BranchReadonly key={b.code} branch={b} />
                        ))}
                      </div>
                    ))}
                    {domain.branches.map((b) => (
                      <div key={b.code} className="p-3">
                        <BranchReadonly branch={b} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BranchReadonly({ branch }: { branch: BranchRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm pl-2">
      <span className="min-w-[12rem] flex-1">{branch.name}</span>
      <span className="text-xs text-muted-foreground font-mono">{branch.code}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        max {branch.maxima.maxPeriode} → ex {branch.maxima.maxExamen} · sem{" "}
        {branch.maxima.maxSemestre} · an {branch.maxima.maxAnnuel}
      </span>
    </div>
  )
}
