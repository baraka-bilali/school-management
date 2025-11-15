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
  const [loading, setLoading] = useState(true)
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
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Gestion du thème
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (newTheme) {
        setTheme(newTheme)
      }
    }

    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)

    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    const perfLabel = `[PERF] Classes fetch`
    console.time(perfLabel)
    
    try {
      const response = await fetch("/api/admin/classes")
      const text = await response.text()
      const data = text ? JSON.parse(text) : { classes: [] }
      setClasses(Array.isArray(data.classes) ? data.classes : [])
      
      console.timeEnd(perfLabel)
      console.log(`[PERF] Loaded ${data.classes?.length || 0} classes`)
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error)
      console.timeEnd(perfLabel)
      setClasses([])
    } finally {
      setLoading(false)
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

  // Variables de couleur basées sur le thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"

  return (
    <Layout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${textColor}`}>Classes & Filières</h1>
            <p className={textSecondary}>Gestion des classes et filières selon le format RDC</p>
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

        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Liste des classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}>
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
                <tbody className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className={`px-3 py-12 text-center ${textSecondary}`}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span>Chargement des classes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {classes.map((cls) => (
                        <tr key={cls.id} className={hoverBg}>
                          <td className={`px-3 py-2 font-medium ${textColor}`}>{cls.name}</td>
                          <td className={`px-3 py-2 ${textColor}`}>{cls.level}</td>
                          <td className={`px-3 py-2 ${textColor}`}>{cls.section}</td>
                          <td className={`px-3 py-2 ${textColor}`}>{cls.letter}</td>
                          <td className={`px-3 py-2 ${textColor}`}>{cls.stream || "-"}</td>
                          <td className={`px-3 py-2 ${textColor}`}>{new Date(cls.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleEdit(cls)}
                                className={`rounded-full p-2 ${textSecondary} hover:text-indigo-600 ${theme === "dark" ? "hover:bg-indigo-900/30" : "hover:bg-indigo-50"} transition-colors`}
                                aria-label="Modifier"
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cls)}
                                className={`rounded-full p-2 ${textSecondary} hover:text-red-600 ${theme === "dark" ? "hover:bg-red-900/30" : "hover:bg-red-50"} transition-colors`}
                                aria-label="Supprimer"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && classes.length === 0 && (
                        <tr>
                          <td colSpan={7} className={`px-3 py-8 text-center ${textSecondary}`}>
                            Aucune classe trouvée.
                          </td>
                        </tr>
                      )}
                    </>
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
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

              <div className={cn(
                "relative w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all duration-200",
                theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200",
                visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} role="dialog" aria-modal="true">
                <div className={`flex items-center justify-between border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
                  <div className={`text-lg font-semibold ${textColor}`}>
                    {editingClass ? "Modifier la classe" : "Créer une classe"}
                  </div>
                  <button className={`${textSecondary} hover:${textColor}`} onClick={() => setShowModal(false)} aria-label="Fermer">×</button>
                </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block ${textColor} mb-1`}>Niveau *</label>
                    <select
                      className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`}
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
                    <label className={`block ${textColor} mb-1`}>Section *</label>
                    <select
                      className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`}
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
                    <label className={`block ${textColor} mb-1`}>Lettre *</label>
                    <select
                      className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`}
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
                    <label className={`block ${textColor} mb-1`}>Filière</label>
                    <select
                      className={`w-full rounded-md border ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"} px-3 py-2`}
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
                
                <div className={theme === "dark" ? "bg-gray-700 p-3 rounded-md" : "bg-gray-50 p-3 rounded-md"}>
                  <div className={`text-sm ${textSecondary} mb-1`}>Aperçu du nom de la classe:</div>
                  <div className={`font-medium text-lg ${textColor}`}>{generatePreviewName() || "..."}</div>
                </div>
              </div>
              <div className={`flex items-center justify-end gap-2 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} px-4 py-3`}>
                <button className={`rounded-md border ${theme === "dark" ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"} px-4 py-2`} onClick={() => setShowModal(false)}>
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
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />

              <div className={cn(
                "relative w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-200",
                theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200",
                visibleDelete ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} role="dialog" aria-modal="true">
                <div className="p-4">
                  <div className={`text-lg font-semibold mb-2 ${textColor}`}>Confirmer la suppression</div>
                  <div className={`${textSecondary} mb-4`}>
                    Êtes-vous sûr de vouloir supprimer la classe "{deletingClass?.name}" ?
                    Cette action est irréversible.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className={`rounded-md border ${theme === "dark" ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"} px-4 py-2`}
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


