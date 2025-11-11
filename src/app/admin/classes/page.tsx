"use client"

import { useEffect, useState } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Plus, Pencil, Trash2 } from "lucide-react"
import Portal from "@/components/portal"
import { cn } from "@/lib/utils"

interface Class {
  id: number
  name: string
  level: string
  section: string
  letter: string
  stream?: string
  createdAt: string
}

interface ClassForm {
  level: string
  section: string
  letter: string
  stream: string
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [form, setForm] = useState<ClassForm>({
    level: "",
    section: "",
    letter: "",
    stream: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [mountedDelete, setMountedDelete] = useState(false)
  const [visibleDelete, setVisibleDelete] = useState(false)

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/admin/classes")
      const text = await response.text()
      const data = text ? JSON.parse(text) : { classes: [] }
      setClasses(Array.isArray(data.classes) ? data.classes : [])
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error)
      setClasses([])
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  // Gérer les animations du modal
  useEffect(() => {
    if (showModal) {
      setMounted(true)
      const id = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(id)
    }

    setVisible(false)
    const t = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(t)
  }, [showModal])

  // Reset form when opening modal
  useEffect(() => {
    if (showModal && !editingClass) {
      setForm({ level: "", section: "", letter: "", stream: "" })
      setSubmitting(false)
    }
  }, [showModal, editingClass])

  // Gérer les animations du modal de suppression
  useEffect(() => {
    if (showDeleteModal) {
      setMountedDelete(true)
      const id = setTimeout(() => setVisibleDelete(true), 10)
      return () => clearTimeout(id)
    }

    setVisibleDelete(false)
    const t = setTimeout(() => setMountedDelete(false), 220)
    return () => clearTimeout(t)
  }, [showDeleteModal])

  const handleCreate = () => {
    setEditingClass(null)
    setForm({ level: "", section: "", letter: "", stream: "" })
    setShowModal(true)
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setForm({
      level: cls.level,
      section: cls.section,
      letter: cls.letter,
      stream: cls.stream || ""
    })
    setShowModal(true)
  }

  const handleDelete = (cls: Class) => {
    setDeletingClass(cls)
    setShowDeleteModal(true)
  }

  const handleSubmit = async () => {
    if (!form.level || !form.section || !form.letter) {
      alert("Niveau, Section et Lettre sont obligatoires")
      return
    }

    setSubmitting(true)
    try {
      const url = editingClass 
        ? `/api/admin/classes/${editingClass.id}`
        : "/api/admin/classes"
      
      const method = editingClass ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur")
      }

      setShowModal(false)
      fetchClasses()
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingClass) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/classes/${deletingClass.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur")
      }

      setShowDeleteModal(false)
      setDeletingClass(null)
      fetchClasses()
    } catch (error) {
      alert((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const generatePreviewName = () => {
    if (!form.level || !form.section || !form.letter) return ""
    
    let name = `${form.level} ${form.letter} ${form.section}`
    if (form.stream && (form.section === "Secondaire" || form.section === "Supérieur")) {
      name += ` ${form.stream}`
    }
    return name
  }

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Classes & Filières</h1>
            <p className="text-gray-600">Gestion des classes et filières selon le format RDC</p>
          </div>
          <button
            onClick={handleCreate}
            aria-label="Créer une classe"
            title="Créer une classe"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nom de la classe</th>
                    <th className="px-3 py-2 text-left font-medium">Niveau</th>
                    <th className="px-3 py-2 text-left font-medium">Section</th>
                    <th className="px-3 py-2 text-left font-medium">Division</th>
                    <th className="px-3 py-2 text-left font-medium">Filière</th>
                    <th className="px-3 py-2 text-left font-medium">Créée le</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{cls.name}</td>
                      <td className="px-3 py-2">{cls.level}</td>
                      <td className="px-3 py-2">{cls.section}</td>
                      <td className="px-3 py-2">{cls.letter}</td>
                      <td className="px-3 py-2">{cls.stream || "-"}</td>
                      <td className="px-3 py-2">{new Date(cls.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(cls)}
                            className="rounded-full p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            aria-label="Modifier"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls)}
                            className="rounded-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Supprimer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        Aucune classe trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de création/édition */}
        {mounted && (
          <Portal>
            <div className={cn(
              "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200",
              visible ? "opacity-100" : "opacity-0 pointer-events-none"
            )} aria-hidden={!visible}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />

              <div className={cn(
                "relative w-full max-w-2xl rounded-lg bg-white shadow transform transition-all duration-200",
                visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} role="dialog" aria-modal="true">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="text-lg font-semibold">
                    {editingClass ? "Modifier la classe" : "Créer une classe"}
                  </div>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)} aria-label="Fermer">×</button>
                </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Niveau *</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                    >
                      <option value="">Sélectionner</option>
                      <option value="1ère">1ère</option>
                      <option value="2ème">2ème</option>
                      <option value="3ème">3ème</option>
                      <option value="4ème">4ème</option>
                      <option value="5ème">5ème</option>
                      <option value="6ème">6ème</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Section *</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                    >
                      <option value="">Sélectionner</option>
                      <option value="Primaire">Primaire</option>
                      <option value="Secondaire">Secondaire</option>
                      <option value="Supérieur">Supérieur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Lettre *</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={form.letter}
                      onChange={(e) => setForm({ ...form, letter: e.target.value })}
                    >
                      <option value="">Sélectionner</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Filière</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={form.stream}
                      onChange={(e) => setForm({ ...form, stream: e.target.value })}
                      disabled={form.section !== "Secondaire" && form.section !== "Supérieur"}
                    >
                      <option value="">Aucune</option>
                      <option value="Scientifique">Scientifique</option>
                      <option value="Littéraire">Littéraire</option>
                      <option value="Technique">Technique</option>
                      <option value="Commerciale">Commerciale</option>
                      <option value="Économique">Économique</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-600 mb-1">Aperçu du nom de la classe:</div>
                  <div className="font-medium text-lg">{generatePreviewName() || "..."}</div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <button className="rounded-md border px-4 py-2" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button
                  disabled={submitting || !generatePreviewName()}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                  onClick={handleSubmit}
                >
                  {submitting ? "Enregistrement..." : (editingClass ? "Modifier" : "Créer")}
                </button>
              </div>
            </div>
          </div>
          </Portal>
        )}

        {/* Modal de confirmation de suppression */}
        {mountedDelete && (
          <Portal>
            <div className={cn(
              "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200",
              visibleDelete ? "opacity-100" : "opacity-0 pointer-events-none"
            )} aria-hidden={!visibleDelete}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />

              <div className={cn(
                "relative w-full max-w-md rounded-lg bg-white shadow transform transition-all duration-200",
                visibleDelete ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} role="dialog" aria-modal="true">
                <div className="p-4">
                  <div className="text-lg font-semibold mb-2">Confirmer la suppression</div>
                  <div className="text-gray-600 mb-4">
                    Êtes-vous sûr de vouloir supprimer la classe "{deletingClass?.name}" ?
                    Cette action est irréversible.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="rounded-md border px-4 py-2"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Annuler
                    </button>
                    <button
                      disabled={submitting}
                      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                      onClick={confirmDelete}
                    >
                      {submitting ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
    </Layout>
  )
}


