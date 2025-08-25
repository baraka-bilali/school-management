"use client"

import { useEffect, useMemo, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"

type TabKey = "students" | "teachers"

interface PaginationState {
  page: number
  pageSize: number
}

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>("students")

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-gray-600">Gestion des administrateurs, enseignants et élèves.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "students"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-600 hover:text-gray-800"
            )}
            onClick={() => setTab("students")}
          >
            Élèves
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2",
              tab === "teachers"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-600 hover:text-gray-800"
            )}
            onClick={() => setTab("teachers")}
          >
            Enseignants
          </button>
        </div>

        {tab === "students" ? <StudentsSection /> : <TeachersSection />}
      </div>
    </Layout>
  )
}

function CreateStudentModal({
  open,
  onClose,
  classes,
  years,
  defaultYearId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  classes: Array<{ id: number; name: string }>
  years: Array<{ id: number; name: string }>
  defaultYearId?: number
  onCreated: (payload: { email: string; plaintextPassword: string }) => void
}) {
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    code: "",
    classId: "",
    academicYearId: defaultYearId ? String(defaultYearId) : "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (defaultYearId) setForm((f) => ({ ...f, academicYearId: String(defaultYearId) }))
  }, [defaultYearId])

  if (!open) return null

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classId: Number(form.classId),
          academicYearId: form.academicYearId ? Number(form.academicYearId) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onCreated({ email: data.user.email, plaintextPassword: data.plaintextPassword })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-lg font-semibold">Créer un élève</div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-gray-700 mb-1">Nom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Post-nom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Prénom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Sexe</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Date de naissance</label>
            <input type="date" className="w-full rounded-md border px-3 py-2" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Code</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Classe</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Sélectionner</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Année académique</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">Sélectionner</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button className="rounded-md border px-4 py-2" onClick={onClose}>Annuler</button>
          <button disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60" onClick={submit}>
            {submitting ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toolbar({
  placeholder,
  onCreate,
  rightContent,
  onSearch,
}: {
  placeholder: string
  onCreate: () => void
  rightContent?: React.ReactNode
  onSearch: (q: string) => void
}) {
  const [q, setQ] = useState("")
  useEffect(() => {
    const id = setTimeout(() => onSearch(q), 300)
    return () => clearTimeout(id)
  }, [q])
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-1 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full sm:max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {rightContent}
      </div>
      <button
        onClick={onCreate}
        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Créer
      </button>
    </div>
  )
}

function Pagination({ state, setState, total }: { state: PaginationState; setState: (s: PaginationState) => void; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize))
  return (
    <div className="flex items-center justify-between py-2 text-sm text-gray-600">
      <div>
        Page {state.page} / {totalPages}
      </div>
      <div className="space-x-2">
        <button
          onClick={() => setState({ ...state, page: Math.max(1, state.page - 1) })}
          className="px-3 py-1 rounded border bg-white hover:bg-gray-50"
        >
          Précédent
        </button>
        <button
          onClick={() => setState({ ...state, page: Math.min(totalPages, state.page + 1) })}
          className="px-3 py-1 rounded border bg-white hover:bg-gray-50"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

function StudentsSection() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 })
  const [filters, setFilters] = useState<{ q?: string; classId?: string; yearId?: string; sort?: string }>({ sort: "name_asc" })
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([])
  const [years, setYears] = useState<Array<{ id: number; name: string; current: boolean }>>([])
  const [currentYearId, setCurrentYearId] = useState<number | null>(null)
  const [banner, setBanner] = useState<{ email: string; password: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // Load filter data (classes and academic years)
  useEffect(() => {
    fetch("/api/admin/meta")
      .then((r) => r.json())
      .then((res) => {
        setClasses(res.classes || [])
        setYears(res.years || [])
        if (res.currentYearId) {
          setCurrentYearId(res.currentYearId)
          setFilters((f) => ({ ...f, yearId: String(res.currentYearId) }))
        }
      })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set("q", filters.q)
    if (filters.classId) params.set("classId", filters.classId)
    if (filters.yearId) params.set("yearId", filters.yearId)
    if (filters.sort) params.set("sort", filters.sort)
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    fetch(`/api/admin/students?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        setItems(res.items || [])
        setTotal(res.total || 0)
      })
  }, [pagination, filters])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Élèves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {banner && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="font-medium">Compte créé</div>
            <div>Identifiants à transmettre une seule fois:</div>
            <div className="mt-1"><span className="font-semibold">Email:</span> {banner.email}</div>
            <div><span className="font-semibold">Mot de passe:</span> {banner.password}</div>
            <button className="mt-2 text-green-700 underline" onClick={() => setBanner(null)}>Fermer</button>
          </div>
        )}
        <Toolbar
          placeholder="Search by last name, middle name or code"
          onCreate={() => setShowCreate(true)}
          onSearch={(q) => setFilters((f) => ({ ...f, q }))}
          rightContent={
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.classId || ""}
                onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value || undefined }))}
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.yearId || ""}
                onChange={(e) => setFilters((f) => ({ ...f, yearId: e.target.value || undefined }))}
              >
                <option value="">Toutes les années</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}{y.current ? " (en cours)" : ""}</option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="name_asc">Nom (A→Z)</option>
                <option value="name_desc">Nom (Z→A)</option>
                <option value="class">Classe</option>
              </select>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Nom</th>
                <th className="px-3 py-2 text-left font-medium">Post-nom</th>
                <th className="px-3 py-2 text-left font-medium">Prénom</th>
                <th className="px-3 py-2 text-left font-medium">Sexe</th>
                <th className="px-3 py-2 text-left font-medium">Naissance</th>
                <th className="px-3 py-2 text-left font-medium">Classe</th>
                <th className="px-3 py-2 text-left font-medium">Année</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((s) => {
                const enr = s.enrollments?.[0]
                const isOpen = expandedId === s.id
                return (
                  <>
                    <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : s.id)}>
                      <td className="px-3 py-2">{s.code}</td>
                      <td className="px-3 py-2">{s.lastName}</td>
                      <td className="px-3 py-2">{s.middleName}</td>
                      <td className="px-3 py-2">{s.firstName}</td>
                      <td className="px-3 py-2">{s.gender}</td>
                      <td className="px-3 py-2">{new Date(s.birthDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{enr?.class?.name || "-"}</td>
                      <td className="px-3 py-2">{enr?.year?.name || "-"}</td>
                      <td className="px-3 py-2">
                        <button className="text-indigo-600 hover:underline" onClick={(e) => { e.stopPropagation(); alert("Edit") }}>Éditer</button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-3 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div><span className="text-gray-500">Nom</span><div className="font-medium">{s.lastName}</div></div>
                            <div><span className="text-gray-500">Post-nom</span><div className="font-medium">{s.middleName}</div></div>
                            <div><span className="text-gray-500">Prénom</span><div className="font-medium">{s.firstName}</div></div>
                            <div><span className="text-gray-500">Sexe</span><div className="font-medium">{s.gender}</div></div>
                            <div><span className="text-gray-500">Naissance</span><div className="font-medium">{new Date(s.birthDate).toLocaleDateString()}</div></div>
                            <div><span className="text-gray-500">Classe</span><div className="font-medium">{enr?.class?.name || "-"}</div></div>
                            <div><span className="text-gray-500">Année</span><div className="font-medium">{enr?.year?.name || "-"}</div></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">Aucun élève trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination state={pagination} setState={setPagination} total={total} />
        <CreateStudentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          classes={classes}
          years={years}
          defaultYearId={currentYearId || undefined}
          onCreated={(payload) => {
            setShowCreate(false)
            setBanner({ email: payload.email, password: payload.plaintextPassword })
            // refresh list
            setPagination((p) => ({ ...p }))
          }}
        />
      </CardContent>
    </Card>
  )
}

function TeachersSection() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 })
  const [q, setQ] = useState("")
  const [years, setYears] = useState<Array<{ id: number; name: string }>>([])
  const [currentYearName, setCurrentYearName] = useState<string>("-")
  const [banner, setBanner] = useState<{ email: string; password: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    ;(async () => {
      try {
        const r = await fetch(`/api/admin/teachers?${params.toString()}`)
        const text = await r.text()
        const res = text ? JSON.parse(text) : { items: [], total: 0 }
        setItems(res.items || [])
        setTotal(res.total || 0)
      } catch (e) {
        console.error(e)
        setItems([])
        setTotal(0)
      }
    })()
  }, [pagination, q])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/admin/meta")
        const text = await r.text()
        const res = text ? JSON.parse(text) : { years: [], currentYearId: null }
        setYears(res.years || [])
        const cy = (res.years || []).find((y: any) => y.id === res.currentYearId)
        setCurrentYearName(cy?.name || "-")
      } catch (e) {
        console.error(e)
        setYears([])
        setCurrentYearName("-")
      }
    })()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enseignants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {banner && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="font-medium">Compte créé</div>
            <div>Identifiants à transmettre une seule fois:</div>
            <div className="mt-1"><span className="font-semibold">Email:</span> {banner.email}</div>
            <div><span className="font-semibold">Mot de passe:</span> {banner.password}</div>
            <button className="mt-2 text-green-700 underline" onClick={() => setBanner(null)}>Fermer</button>
          </div>
        )}
        <Toolbar
          placeholder="Rechercher par nom, spécialité ou téléphone"
          onCreate={() => setShowCreate(true)}
          onSearch={setQ}
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Nom</th>
                <th className="px-3 py-2 text-left font-medium">Post-nom</th>
                <th className="px-3 py-2 text-left font-medium">Prénom</th>
                <th className="px-3 py-2 text-left font-medium">Sexe</th>
                <th className="px-3 py-2 text-left font-medium">Naissance</th>
                <th className="px-3 py-2 text-left font-medium">Spécialité</th>
                <th className="px-3 py-2 text-left font-medium">Téléphone</th>
                <th className="px-3 py-2 text-left font-medium">Année</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">{t.lastName}</td>
                  <td className="px-3 py-2">{t.middleName}</td>
                  <td className="px-3 py-2">{t.firstName}</td>
                  <td className="px-3 py-2">{t.gender}</td>
                  <td className="px-3 py-2">{new Date(t.birthDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{t.specialty || "-"}</td>
                  <td className="px-3 py-2">{t.phone || "-"}</td>
                  <td className="px-3 py-2">{currentYearName}</td>
                  <td className="px-3 py-2">
                    <button className="text-indigo-600 hover:underline" onClick={() => alert("Edit")}>Éditer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">Aucun enseignant trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination state={pagination} setState={setPagination} total={total} />
        <CreateTeacherModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(payload) => {
            setShowCreate(false)
            setBanner({ email: payload.email, password: payload.plaintextPassword })
            setPagination((p) => ({ ...p }))
          }}
        />
      </CardContent>
    </Card>
  )
}

function CreateTeacherModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (payload: { email: string; plaintextPassword: string }) => void
}) {
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    specialty: "",
    phone: "",
  })
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onCreated({ email: data.user.email, plaintextPassword: data.plaintextPassword })
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-lg font-semibold">Créer un enseignant</div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-gray-700 mb-1">Nom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Post-nom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Prénom</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Sexe</label>
            <select className="w-full rounded-md border px-3 py-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Date de naissance</label>
            <input type="date" className="w-full rounded-md border px-3 py-2" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Spécialité</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Téléphone</label>
            <input className="w-full rounded-md border px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button className="rounded-md border px-4 py-2" onClick={onClose}>Annuler</button>
          <button disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60" onClick={submit}>
            {submitting ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  )
}

