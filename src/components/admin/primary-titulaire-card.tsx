"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import { Loader2, UserCheck } from "lucide-react"

type Teacher = {
  id: number
  lastName: string
  middleName?: string | null
  firstName: string
}

export function PrimaryTitulaireCard({
  classId,
  section,
  titulaireTeacherId,
  onChanged,
}: {
  classId: number
  section: string
  titulaireTeacherId?: number | null
  onChanged?: () => void
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherId, setTeacherId] = useState<string>(
    titulaireTeacherId ? String(titulaireTeacherId) : ""
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (section !== "Primaire") return
    void (async () => {
      try {
        const res = await authFetch("/api/admin/teachers?pageSize=200")
        const data = await res.json()
        if (!res.ok) return
        const list = (data.teachers || data.items || data.data || []) as Teacher[]
        setTeachers(Array.isArray(list) ? list : [])
      } catch {
        /* ignore */
      }
    })()
  }, [section])

  useEffect(() => {
    setTeacherId(titulaireTeacherId ? String(titulaireTeacherId) : "")
  }, [titulaireTeacherId])

  if (section !== "Primaire") return null

  async function assign() {
    if (!teacherId) {
      toast.error("Choisissez un enseignant")
      return
    }
    setSaving(true)
    try {
      const res = await authFetch(`/api/admin/classes/${classId}/titulaire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: Number(teacherId) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Affectation impossible")
      toast.success(
        `Titulaire assigné — ${data.total ?? "?"} branche(s)` +
          (data.created != null ? ` (${data.created} créées, ${data.updated} mises à jour)` : "")
      )
      onChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border p-4 space-y-3 bg-background">
      <div className="flex items-center gap-2 font-medium text-sm">
        <UserCheck className="h-4 w-4" />
        Titulaire de classe (primaire)
      </div>
      <p className="text-xs text-muted-foreground">
        Assigne en un clic toutes les branches actives du degré à cet enseignant. Un titulaire
        primaire ne peut avoir qu&apos;une seule classe.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="rounded border px-2 py-1.5 text-sm bg-background min-w-[16rem]"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">— Choisir un enseignant —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {[t.lastName, t.middleName, t.firstName].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={saving || !teacherId}
          onClick={() => void assign()}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 text-white px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Assigner un titulaire
        </button>
      </div>
    </div>
  )
}
