"use client"

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react"

type BranchRow = {
  id: number
  name: string
  maxPeriode: number
  maxima: { maxPeriode: number; maxExamen: number; maxTrimestre: number; maxAnnuel: number }
  subjectId: number | null
}

type DomainRow = {
  id: number
  name: string
  maxPeriodeSubtotal: number
  groups: Array<{
    id: number
    name: string
    maxPeriodeSubtotal: number
    branches: BranchRow[]
  }>
  branches: BranchRow[]
}

type DegreeRow = {
  id: number
  code: string
  name: string
  levels: string[]
  needsReview: boolean
  maxPeriodeTotal: number
  maximaGeneraux: { maxPeriode: number; maxExamen: number; maxTrimestre: number; maxAnnuel: number }
  domains: DomainRow[]
}

function shortDegreeLabel(d: DegreeRow): string {
  if (d.levels.length) return d.levels.join(" · ")
  return d.name
}

export function PrimaryCurriculumPanel() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [degrees, setDegrees] = useState<DegreeRow[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [openDomains, setOpenDomains] = useState<Record<number, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/api/admin/primary-curriculum")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Chargement impossible")
      const list = (data.degrees || []) as DegreeRow[]
      setDegrees(list)
      setSelectedId((prev) => prev ?? (list[0]?.id ?? null))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = degrees.find((d) => d.id === selectedId) || null

  useEffect(() => {
    if (!selected) return
    // Expand all domains for newly selected degree
    const next: Record<number, boolean> = {}
    for (const domain of selected.domains) next[domain.id] = true
    setOpenDomains(next)
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function syncCatalog() {
    setSyncing(true)
    try {
      const res = await authFetch("/api/admin/primary-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Synchronisation impossible")
      setDegrees(data.degrees || [])
      toast.success("Structures primaire synchronisées")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSyncing(false)
    }
  }

  async function confirmReview(degreeId: number) {
    try {
      const res = await authFetch("/api/admin/primary-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirmReview", degreeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Confirmation impossible")
      setDegrees(data.degrees || [])
      toast.success("Degré marqué comme vérifié")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  async function saveBranchMax(branchId: number, maxPeriode: number) {
    try {
      const res = await authFetch("/api/admin/primary-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateBranch", branchId, maxPeriode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible")
      setDegrees(data.degrees || [])
      toast.success("Maximum période mis à jour (examen/trimestre/annuel dérivés)")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des branches…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Branches organisées par <strong>degré / niveau</strong> (Domaines → Groupes → Branches).
          Une matière canonique unique est partagée entre degrés ; seul le{" "}
          <strong>max période</strong> varie (examen = 2×, trimestre = 4×, annuel = 12×).
        </p>
        <button
          type="button"
          onClick={() => void syncCatalog()}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Synchroniser le catalogue
        </button>
      </div>

      {/* Degree / level picker — one section per degré */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {degrees.map((d) => {
          const active = selectedId === d.id
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedId(d.id)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "hover:bg-muted border-border"
              }`}
            >
              <div className="text-xs opacity-80">{d.name.replace(/\s*\([^)]*\)\s*$/, "")}</div>
              <div className="text-sm font-semibold mt-0.5">{shortDegreeLabel(d)}</div>
              <div className={`text-xs mt-1 ${active ? "text-teal-100" : "text-muted-foreground"}`}>
                max période {d.maxPeriodeTotal}
                {d.needsReview ? " · à vérifier" : ""}
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
                Niveaux : <strong>{selected.levels.join(", ") || "—"}</strong>
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Maxima généraux → période {selected.maxPeriodeTotal} · examen{" "}
              {selected.maximaGeneraux.maxExamen} · trimestre {selected.maximaGeneraux.maxTrimestre}{" "}
              · annuel {selected.maximaGeneraux.maxAnnuel}
            </div>
          </div>

          {selected.needsReview && (
            <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Valeurs à vérifier avant production
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Ce degré a été seedé à partir d&apos;une lecture partielle du bulletin officiel.
                  Faites confirmer les noms de branches et maxima par un enseignant avant de générer
                  de vrais bulletins.
                </p>
                <button
                  type="button"
                  onClick={() => void confirmReview(selected.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-700 text-white px-3 py-1.5 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4" /> Marquer comme vérifié
                </button>
              </div>
            </div>
          )}

          {selected.domains.map((domain) => {
            const open = openDomains[domain.id] !== false
            return (
              <div key={domain.id} className="rounded-xl border overflow-hidden">
                <button
                  type="button"
                  className="w-full bg-muted/50 px-4 py-2.5 flex items-center justify-between gap-2 text-left"
                  onClick={() =>
                    setOpenDomains((prev) => ({ ...prev, [domain.id]: !open }))
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
                      <div key={group.id} className="p-3 space-y-2">
                        <div className="text-sm font-medium flex justify-between">
                          <span>{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.maxPeriodeSubtotal}
                          </span>
                        </div>
                        {group.branches.map((b) => (
                          <BranchEditor key={b.id} branch={b} onSave={saveBranchMax} />
                        ))}
                      </div>
                    ))}
                    {domain.branches.map((b) => (
                      <div key={b.id} className="p-3">
                        <BranchEditor branch={b} onSave={saveBranchMax} />
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

function BranchEditor({
  branch,
  onSave,
}: {
  branch: BranchRow
  onSave: (id: number, maxPeriode: number) => Promise<void>
}) {
  const [value, setValue] = useState(String(branch.maxPeriode))
  const [saving, setSaving] = useState(false)
  useEffect(() => setValue(String(branch.maxPeriode)), [branch.maxPeriode])

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm pl-2">
      <span className="min-w-[12rem] flex-1">{branch.name}</span>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        max période
        <input
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 rounded border px-2 py-1 text-sm bg-background"
        />
      </label>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        → ex {branch.maxima.maxExamen} · trim {branch.maxima.maxTrimestre} · an{" "}
        {branch.maxima.maxAnnuel}
      </span>
      <button
        type="button"
        disabled={saving || Number(value) === branch.maxPeriode}
        onClick={async () => {
          const n = Number(value)
          if (!Number.isFinite(n) || n <= 0) {
            toast.error("Maximum invalide")
            return
          }
          setSaving(true)
          try {
            await onSave(branch.id, n)
          } finally {
            setSaving(false)
          }
        }}
        className="rounded border px-2 py-1 text-xs disabled:opacity-40"
      >
        {saving ? "…" : "OK"}
      </button>
    </div>
  )
}
