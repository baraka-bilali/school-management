"use client"

import { useEffect, useMemo, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { cn } from "@/lib/utils"
import React from "react"
import Portal from "@/components/portal"
import { Eye, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Banner } from "@/components/ui/banner"

type TabKey = "students" | "teachers"

interface PaginationState {
  page: number
  pageSize: number
}

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>("students")
  const [tabVisible, setTabVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Effet pour gérer le montage initial
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Effet pour gérer les transitions de tab
  useEffect(() => {
    if (!isMounted) return
    setTabVisible(false)
    const id = setTimeout(() => setTabVisible(true), 20)
    return () => clearTimeout(id)
  }, [tab, isMounted])

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

        <div className={`transition-all duration-250 ease-out transform ${tabVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
          {tab === "students" ? <StudentsSection /> : <TeachersSection />}
        </div>
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
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (defaultYearId) setForm((f) => ({ ...f, academicYearId: String(defaultYearId) }))
  }, [defaultYearId])

  // manage mount/visibility so opening animates smoothly
  useEffect(() => {
    if (open) {
      setMounted(true)
      // allow the element to mount first, then set visible to trigger CSS transition
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }

    // closing: animate out first then unmount
    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null
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
    <Portal>
      {/* overlay */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!visible}>
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* dialog */}
        <div className={`relative w-full max-w-2xl rounded-lg bg-white shadow transform transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} role="dialog" aria-modal="true">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-lg font-semibold">Créer un élève</div>
            <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Fermer">×</button>
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
    </Portal>
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
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 10 })
  const [filters, setFilters] = useState<{ q?: string; classId?: string; yearId?: string; sort?: string }>({ sort: "name_asc" })
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([])
  const [years, setYears] = useState<Array<{ id: number; name: string; current: boolean }>>([])
  const [currentYearId, setCurrentYearId] = useState<number | null>(null)
  const [banner, setBanner] = useState<{
    message?: string;
    email?: string;
    password?: string;
    type?: 'success' | 'error';
    notificationType: 'create' | 'update';
  } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    code: "",
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    classId: "",
  })

  const handleEdit = (student: any) => {
    setEditingId(student.id)
    setEditForm({
      code: student.code,
      lastName: student.lastName,
      middleName: student.middleName,
      firstName: student.firstName,
      gender: student.gender,
      birthDate: student.birthDate.split('T')[0],
      classId: student.enrollments?.[0]?.classId?.toString() || "",
    })
  }

  const handleSaveEdit = async (studentId: number) => {
    try {
      // avoid sending update when nothing changed
      const original = items.find((it) => it.id === studentId)
      const originalClassId = original?.enrollments?.[0]?.classId?.toString() || ""
      const changed = (
        original?.code !== editForm.code ||
        original?.lastName !== editForm.lastName ||
        original?.middleName !== editForm.middleName ||
        original?.firstName !== editForm.firstName ||
        original?.gender !== editForm.gender ||
        (original?.birthDate?.split?.('T')?.[0] || '') !== editForm.birthDate ||
        originalClassId !== (editForm.classId || '')
      )

      if (!changed) {
        setEditingId(null)
        setBanner({ message: "Aucune modification détectée.", type: "success", notificationType: "update" })
        setTimeout(() => setBanner(null), 2500)
        return
      }

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          classId: editForm.classId ? Number(editForm.classId) : undefined,
        }),
      })

      // handle JSON or non-JSON responses gracefully
      const text = await response.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        data = { error: text }
      }

      if (!response.ok) {
        throw new Error(data.error || text || 'Erreur lors de la modification')
      }

      // Mettre à jour la liste des étudiants
      setItems(items.map(item => {
        if (item.id === studentId) {
          return {
            ...item,
            ...editForm,
            enrollments: [
              {
                ...item.enrollments[0],
                classId: editForm.classId ? Number(editForm.classId) : item.enrollments[0]?.classId,
              },
              ...item.enrollments.slice(1),
            ],
          }
        }
        return item
      }))

      setEditingId(null)
      // show loading while we refresh the list
      setLoading(true)
      setBanner({ 
        message: "L'étudiant a été", 
        type: "success",
        notificationType: "update"
      })
      // refresh list to get the latest data
      setPagination((p) => ({ ...p }))
      setTimeout(() => setBanner(null), 3000)
    } catch (error) {
      setBanner({ 
        message: "Une erreur est survenue lors de la modification de l'étudiant", 
        type: "error",
        notificationType: "update"
      })
      setTimeout(() => setBanner(null), 3000)
      console.error(error)
    }
  }

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
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.q) params.set("q", filters.q)
        if (filters.classId) params.set("classId", filters.classId)
        if (filters.yearId) params.set("yearId", filters.yearId)
        if (filters.sort) params.set("sort", filters.sort)
        params.set("page", String(pagination.page))
        params.set("pageSize", String(pagination.pageSize))
        
        const response = await fetch(`/api/admin/students?${params.toString()}`)
        const res = await response.json()
        setItems(res.items || [])
        setTotal(res.total || 0)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pagination, filters])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Élèves</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          {banner && (
            <Banner
              type={banner.type}
              message={banner.message}
              email={banner.email}
              password={banner.password}
              notificationType={banner.notificationType}
              onClose={() => setBanner(null)}
            />
          )}
        {/* Barre de recherche par mots clés */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Rechercher par nom, post-nom ou code"
              onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors"
          >
            Ajouter
          </button>
        </div>

        {/* Filtres en dessous */}
        <div className="space-y-3">
          {/* Version mobile : Filtres en colonne */}
          <div className="md:hidden flex flex-col gap-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                value={filters.classId || ""}
                onChange={(e) => setFilters((f) => ({ ...f, classId: e.target.value || undefined }))}
              >
                <option value="">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                value={filters.yearId || ""}
                onChange={(e) => setFilters((f) => ({ ...f, yearId: e.target.value || undefined }))}
              >
                <option value="">Toutes les années</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}{y.current ? " (en cours)" : ""}</option>
                ))}
              </select>
            </div>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="name_asc">Nom (A→Z)</option>
              <option value="name_desc">Nom (Z→A)</option>
              <option value="class">Classe</option>
            </select>
          </div>

          {/* Version desktop : Filtres en ligne */}
          <div className="hidden md:flex items-center gap-2">
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
        </div>

        <div>
          {/* Mobile: stacked cards */}
          <div className="md:hidden space-y-3">
            {loading && (
              <div className="px-3 py-8 text-center text-gray-500">Chargement des données...</div>
            )}
            {!loading && items.map((s) => {
              const enr = s.enrollments?.[0]
              return (
                <div key={`mobile-${s.id}`} className="p-4 bg-white rounded-md shadow-sm border space-y-4">
                  {/* En-tête avec code et actions */}
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">Code: {s.code}</div>
                    <button className="rounded-full p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); }}>
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Informations personnelles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Nom complet</div>
                      <div className="mt-1 text-sm text-gray-900">{s.lastName} {s.middleName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Prénom</div>
                      <div className="mt-1 text-sm text-gray-900">{s.firstName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Classe</div>
                      <div className="mt-1 text-sm text-gray-900">{enr?.class?.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Année</div>
                      <div className="mt-1 text-sm text-gray-900">{enr?.year?.name || '-'}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {!loading && items.length === 0 && (
              <div className="px-3 py-8 text-center text-gray-500">Aucun élève trouvé.</div>
            )}
          </div>

          {/* Desktop/tablet: keep existing table */}
          <div className="hidden md:block overflow-x-auto relative">
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
              {loading && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Chargement des données...</div>
                  </td>
                </tr>
              )}
              {!loading && items.map((s) => {
                const enr = s.enrollments?.[0]
                const isOpen = expandedId === s.id
                return (
                  <React.Fragment key={s.id}>
                    <tr className={cn(
                      "hover:bg-gray-50 cursor-pointer",
                      editingId === s.id ? "bg-blue-50" : ""
                    )} onClick={() => !editingId && setExpandedId(isOpen ? null : s.id)}>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.code}
                            onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                          />
                        ) : s.code}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        ) : s.lastName}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.middleName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, middleName: e.target.value }))}
                          />
                        ) : s.middleName}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        ) : s.firstName}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <select
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.gender}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                          >
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        ) : s.gender}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <input
                            type="date"
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.birthDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                          />
                        ) : new Date(s.birthDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        {editingId === s.id ? (
                          <select
                            className="w-full rounded-md border px-2 py-1"
                            value={editForm.classId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, classId: e.target.value }))}
                          >
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        ) : enr?.class?.name || "-"}
                      </td>
                      <td className="px-3 py-2">{enr?.year?.name || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {editingId === s.id ? (
                            <>
                              <button 
                                className="text-green-600 hover:text-green-700 transition-colors cursor-pointer relative group" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleSaveEdit(s.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                                <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Valider
                                </span>
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-700 transition-colors cursor-pointer relative group" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  setEditingId(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                                <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Annuler
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer relative group" 
                                onClick={(e) => { 
                                  e.stopPropagation();
                                  handleEdit(s);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Modifier
                                </span>
                              </button>
                              <button 
                                className="text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer relative group" 
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[11px] px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Détails
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr key={`${s.id}-expanded`} className="bg-gray-50">
                      <td colSpan={9} className="px-3 py-0">
                        <div className={cn(
                          "overflow-hidden transition-all duration-300",
                          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm py-3">
                            <div><span className="text-gray-500">Nom</span><div className="font-medium">{s.lastName}</div></div>
                            <div><span className="text-gray-500">Post-nom</span><div className="font-medium">{s.middleName}</div></div>
                            <div><span className="text-gray-500">Prénom</span><div className="font-medium">{s.firstName}</div></div>
                            <div><span className="text-gray-500">Sexe</span><div className="font-medium">{s.gender}</div></div>
                            <div><span className="text-gray-500">Naissance</span><div className="font-medium">{new Date(s.birthDate).toLocaleDateString()}</div></div>
                            <div><span className="text-gray-500">Classe</span><div className="font-medium">{enr?.class?.name || "-"}</div></div>
                            <div><span className="text-gray-500">Année</span><div className="font-medium">{enr?.year?.name || "-"}</div></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
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
            // show credentials banner (no extra message)
            setBanner({
              email: payload.email,
              password: payload.plaintextPassword,
              type: "success",
              notificationType: "create"
            })
            // show loading while refreshing
            setLoading(true)
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
  const [banner, setBanner] = useState<{
    message?: string;
    email?: string;
    password?: string;
    type?: 'success' | 'error';
    notificationType?: 'create' | 'update';
  } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    gender: "M",
    birthDate: "",
    specialty: "",
    phone: "",
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    ;(async () => {
      setLoading(true)
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
      } finally {
        setLoading(false)
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
            <Banner
              type={banner.type}
              message={banner.message}
              email={banner.email}
              password={banner.password}
              notificationType={banner.notificationType}
              onClose={() => setBanner(null)}
            />
          )}
        <Toolbar
          placeholder="Rechercher par nom, spécialité ou téléphone"
          onCreate={() => setShowCreate(true)}
          onSearch={setQ}
        />

        <div>
          {/* Mobile: stacked cards for teachers */}
          <div className="md:hidden space-y-3">
            {loading && (
              <div className="px-3 py-8 text-center text-gray-500">Chargement des données...</div>
            )}
            {!loading && items.map((t) => (
              <div key={`mobile-teacher-${t.id}`} className="p-4 bg-white rounded-md shadow-sm border space-y-4">
                {/* En-tête avec actions */}
                <div className="flex items-center justify-end">
                  <button className="rounded-full p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); }}>
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {/* Informations personnelles */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Nom complet</div>
                    <div className="mt-1 text-sm text-gray-900">{t.lastName} {t.middleName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Prénom</div>
                    <div className="mt-1 text-sm text-gray-900">{t.firstName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Spécialité</div>
                    <div className="mt-1 text-sm text-gray-900">{t.specialty || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Téléphone</div>
                    <div className="mt-1 text-sm text-gray-900">{t.phone || '-'}</div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="px-3 py-8 text-center text-gray-500">Aucun enseignant trouvé.</div>
            )}
          </div>

          {/* Desktop/tablet: keep existing table */}
          <div className="hidden md:block overflow-x-auto">
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
              {loading && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Chargement des données...</div>
                  </td>
                </tr>
              )}
              {!loading && items.map((t) => {
                const isOpen = false // no separate expanded id for teachers; could reuse editingId but keep closed by default
                return (
                  <React.Fragment key={t.id}>
                    <tr className={cn(
                      "hover:bg-gray-50",
                      editingId === t.id ? "bg-blue-50" : ""
                    )}>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
                      ) : t.lastName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editForm.middleName} onChange={(e) => setEditForm(prev => ({ ...prev, middleName: e.target.value }))} />
                      ) : t.middleName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
                      ) : t.firstName}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <select className="w-full rounded-md border px-2 py-1" value={editForm.gender} onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}>
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                      ) : t.gender}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input type="date" className="w-full rounded-md border px-2 py-1" value={editForm.birthDate} onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))} />
                      ) : new Date(t.birthDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editForm.specialty} onChange={(e) => setEditForm(prev => ({ ...prev, specialty: e.target.value }))} />
                      ) : t.specialty || "-"}</td>
                      <td className="px-3 py-2">{editingId === t.id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                      ) : t.phone || "-"}</td>
                      <td className="px-3 py-2">{currentYearName}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {editingId === t.id ? (
                            <>
                              <button className="text-green-600 hover:text-green-700 transition-colors cursor-pointer relative group" onClick={async (e) => { e.stopPropagation();
                                // avoid calling API if nothing changed
                                const changed = (
                                  t.lastName !== editForm.lastName ||
                                  t.middleName !== editForm.middleName ||
                                  t.firstName !== editForm.firstName ||
                                  t.gender !== editForm.gender ||
                                  (t.birthDate ? t.birthDate.split('T')[0] : '') !== editForm.birthDate ||
                                  (t.specialty || '') !== editForm.specialty ||
                                  (t.phone || '') !== editForm.phone
                                )

                                if (!changed) {
                                  setEditingId(null)
                                  setBanner({ message: "Aucune modification détectée.", type: 'success', notificationType: 'update' })
                                  setTimeout(() => setBanner(null), 2500)
                                  return
                                }

                                // handle save
                                try {
                                  const res = await fetch(`/api/admin/teachers/${t.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      lastName: editForm.lastName,
                                      middleName: editForm.middleName,
                                      firstName: editForm.firstName,
                                      gender: editForm.gender,
                                      birthDate: editForm.birthDate,
                                      specialty: editForm.specialty,
                                      phone: editForm.phone,
                                    }),
                                  })

                                  const text = await res.text()
                                  console.log('Server response:', { status: res.status, text })
                                  
                                  let data: any = {}
                                  try {
                                    data = text ? JSON.parse(text) : {}
                                    console.log('Parsed response:', data)
                                  } catch (e) {
                                    console.warn('Failed to parse response as JSON:', text)
                                    data = { error: text }
                                  }

                                  if (!res.ok) {
                                    console.error('Server returned error status:', res.status)
                                    const errorMsg = data.message || data.error || text || 'Erreur lors de la modification'
                                    throw new Error(errorMsg)
                                  }

                                  if (!data || typeof data !== 'object') {
                                    console.warn('Unexpected response format:', data)
                                    throw new Error('Format de réponse invalide')
                                  }

                                  setItems(items.map(item => item.id === t.id ? { 
                                    ...item,
                                    ...editForm,
                                    // preserve other fields that might exist on the server response
                                    ...(data.teacher || data)
                                  } : item))
                                  setEditingId(null)
                                  setLoading(true)
                                  setBanner({ 
                                    message: "L'enseignant a été", 
                                    type: 'success',
                                    notificationType: 'update'
                                  })
                                  setPagination(p => ({ ...p }))
                                  setTimeout(() => setBanner(null), 3000)
                                } catch (err) {
                                  console.error('Teacher update failed:', err)
                                  const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
                                  setBanner({ 
                                    message: `Une erreur est survenue lors de la modification de l'enseignant: ${errorMessage}`, 
                                    type: 'error',
                                  })
                                  setTimeout(() => setBanner(null), 5000) // longer timeout for error messages
                                }
                              }}>
                                <Check className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-700 transition-colors cursor-pointer relative group" onClick={(e) => { e.stopPropagation(); setEditingId(null); }}>
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer relative group" onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditForm({
                                lastName: t.lastName || "",
                                middleName: t.middleName || "",
                                firstName: t.firstName || "",
                                gender: t.gender || "M",
                                birthDate: t.birthDate ? t.birthDate.split('T')[0] : "",
                                specialty: t.specialty || "",
                                phone: t.phone || "",
                              })}}>
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer relative group" onClick={(e) => { e.stopPropagation(); }}>
                                <Eye className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* expanded details row for teachers (animated) */}
                    <tr key={`${t.id}-expanded`} className="bg-gray-50">
                      <td colSpan={9} className="px-3 py-0">
                        <div className={cn(
                          "overflow-hidden transition-all duration-300",
                          editingId === t.id ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm py-3">
                            <div><span className="text-gray-500">Nom</span><div className="font-medium">{t.lastName}</div></div>
                            <div><span className="text-gray-500">Post-nom</span><div className="font-medium">{t.middleName}</div></div>
                            <div><span className="text-gray-500">Prénom</span><div className="font-medium">{t.firstName}</div></div>
                            <div><span className="text-gray-500">Sexe</span><div className="font-medium">{t.gender}</div></div>
                            <div><span className="text-gray-500">Naissance</span><div className="font-medium">{t.birthDate ? new Date(t.birthDate).toLocaleDateString() : "-"}</div></div>
                            <div><span className="text-gray-500">Spécialité</span><div className="font-medium">{t.specialty || "-"}</div></div>
                            <div><span className="text-gray-500">Téléphone</span><div className="font-medium">{t.phone || "-"}</div></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500">Aucun enseignant trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

        <Pagination state={pagination} setState={setPagination} total={total} />
        <CreateTeacherModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={(payload) => {
            setShowCreate(false)
            setBanner({
              email: payload.email,
              password: payload.plaintextPassword,
              type: "success",
              notificationType: "create",
            })
            setLoading(true)
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

  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }

    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

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
    <Portal>
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!visible}>
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className={`relative w-full max-w-2xl rounded-lg bg-white shadow transform transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} role="dialog" aria-modal="true">
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
    </Portal>
  )
}

