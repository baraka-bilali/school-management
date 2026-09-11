"use client"

import { Fragment, Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import Portal from "@/components/portal"
import { cn } from "@/lib/utils"
import { TableLoadingRow } from "@/components/ui/table-loading"
import { SubjectsSection } from "./subjects-section"
import { MenuSelect } from "@/components/ui/menu-select"

// Options spécialisées où la lettre est optionnelle (une seule classe par option)
const STREAM_LETTER_OPTIONAL = new Set([
  "Commerciale et Gestion", "Secrétariat",
  "Électricité", "Mécanique Générale", "Mécanique Automobile", "Électronique", "Aviation",
  "Construction", "Menuiserie", "Dessin de Bâtiment",
  "Agriculture Générale", "Vétérinaire", "Pêche et Forêt",
  "Sociale", "Arts Plastiques", "Musique", "Coupe et Couture", "Imprimerie",
  "Nutrition", "Santé Publique",
])

const STREAM_OPTIONS: { value: string; label: string }[] = [
  { value: "Pédagogie Générale", label: "Humanités Générales · Pédagogie Générale" },
  { value: "Latin-Philosophie", label: "Humanités Générales · Latin-Philosophie" },
  { value: "Math-Physique", label: "Humanités Générales · Math-Physique" },
  { value: "Chimie-Biologie", label: "Humanités Générales · Chimie-Biologie" },
  { value: "Commerciale et Gestion", label: "Commercial et Administratif · Commerciale et Gestion" },
  { value: "Secrétariat", label: "Commercial et Administratif · Secrétariat" },
  { value: "Électricité", label: "Industriel · Électricité" },
  { value: "Mécanique Générale", label: "Industriel · Mécanique Générale" },
  { value: "Mécanique Automobile", label: "Industriel · Mécanique Automobile" },
  { value: "Électronique", label: "Industriel · Électronique" },
  { value: "Aviation", label: "Industriel · Aviation" },
  { value: "Construction", label: "Bâtiment et Travaux Publics · Construction" },
  { value: "Menuiserie", label: "Bâtiment et Travaux Publics · Menuiserie" },
  { value: "Dessin de Bâtiment", label: "Bâtiment et Travaux Publics · Dessin de Bâtiment" },
  { value: "Agriculture Générale", label: "Agricole · Agriculture Générale" },
  { value: "Vétérinaire", label: "Agricole · Vétérinaire" },
  { value: "Pêche et Forêt", label: "Agricole · Pêche et Forêt" },
  { value: "Sociale", label: "Social et Artistique · Sociale" },
  { value: "Arts Plastiques", label: "Social et Artistique · Arts Plastiques" },
  { value: "Musique", label: "Social et Artistique · Musique" },
  { value: "Coupe et Couture", label: "Social et Artistique · Coupe et Couture" },
  { value: "Imprimerie", label: "Social et Artistique · Imprimerie" },
  { value: "Nutrition", label: "Santé · Nutrition" },
  { value: "Santé Publique", label: "Santé · Santé Publique" },
]

const SECTION_OPTIONS = [
  { value: "Maternelle", label: "Maternelle" },
  { value: "Primaire", label: "Primaire" },
  { value: "Education de Base", label: "Éducation de Base" },
  { value: "Humanités", label: "Humanités" },
]

const LETTER_OPTIONS = ["A", "B", "C", "D", "E", "F"].map((l) => ({ value: l, label: l }))

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

type ClassesTab = "classes" | "subjects"

export default function ClassesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-gray-500 dark:text-gray-400">
            Chargement…
          </div>
      }
    >
      <ClassesPageContent />
    </Suspense>
  )
}

function ClassesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = useMemo<ClassesTab>(
    () => (searchParams.get("tab") === "subjects" ? "subjects" : "classes"),
    [searchParams]
  )
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
  const [formError, setFormError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [mountedDelete, setMountedDelete] = useState(false)
  const [visibleDelete, setVisibleDelete] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"))

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
      setFormError(null)
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
    setDeleteConfirmName("")
    setDeleteAcknowledged(false)
    setDeleteError(null)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeletingClass(null)
    setDeleteConfirmName("")
    setDeleteAcknowledged(false)
    setDeleteError(null)
  }

  const canConfirmDelete =
    !!deletingClass &&
    deleteConfirmName.trim() === deletingClass.name &&
    deleteAcknowledged &&
    !submitting

  const handleSubmit = async () => {
    const letterRequired = form.section !== "Maternelle" && !(form.section === "Humanités" && STREAM_LETTER_OPTIONAL.has(form.stream))
    if (!form.level || !form.section || (letterRequired && !form.letter)) {
      setFormError("Veuillez remplir tous les champs obligatoires.")
      return
    }

    setSubmitting(true)
    setFormError(null)
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
        setFormError(error.error || "Une erreur est survenue.")
        return
      }

      setShowModal(false)
      fetchClasses()
    } catch {
      setFormError("Une erreur réseau est survenue. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingClass) return

    if (deleteConfirmName.trim() !== deletingClass.name) {
      setDeleteError("Le nom saisi ne correspond pas exactement à la classe.")
      return
    }
    if (!deleteAcknowledged) {
      setDeleteError("Vous devez cocher la case de confirmation.")
      return
    }

    setSubmitting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/admin/classes/${deletingClass.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur")
      }

      closeDeleteModal()
      fetchClasses()
    } catch (error) {
      setDeleteError((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const LEVELS_BY_SECTION: Record<string, string[]> = {
    Maternelle: ["Petite Section", "Moyenne Section", "Grande Section"],
    Primaire: ["1ère", "2ème", "3ème", "4ème", "5ème", "6ème"],
    "Education de Base": ["7ème", "8ème"],
    Humanités: ["1ère", "2ème", "3ème", "4ème"],
  }

  const SECTION_ORDER = ["Maternelle", "Primaire", "Education de Base", "Humanités"]
  const SECTION_LABELS: Record<string, string> = {
    Maternelle: "Maternelle — Préscolaire",
    Primaire: "Primaire",
    "Education de Base": "Éducation de Base — 7ème & 8ème",
    Humanités: "Humanités",
  }
  const sectionStyles: Record<string, { bg: string; text: string }> = {
    Maternelle: {
      bg: theme === "dark" ? "bg-pink-900/20 border-l-4 border-pink-500" : "bg-pink-50 border-l-4 border-pink-400",
      text: theme === "dark" ? "text-pink-300 font-semibold" : "text-pink-700 font-semibold",
    },
    Primaire: {
      bg: theme === "dark" ? "bg-blue-900/20 border-l-4 border-blue-500" : "bg-blue-50 border-l-4 border-blue-400",
      text: theme === "dark" ? "text-blue-300 font-semibold" : "text-blue-700 font-semibold",
    },
    "Education de Base": {
      bg: theme === "dark" ? "bg-orange-900/20 border-l-4 border-orange-500" : "bg-orange-50 border-l-4 border-orange-400",
      text: theme === "dark" ? "text-orange-300 font-semibold" : "text-orange-700 font-semibold",
    },
    Humanités: {
      bg: theme === "dark" ? "bg-green-900/20 border-l-4 border-green-500" : "bg-green-50 border-l-4 border-green-400",
      text: theme === "dark" ? "text-green-300 font-semibold" : "text-green-700 font-semibold",
    },
  }

  const generatePreviewName = () => {
    if (!form.level || !form.section) return ""
    if (form.section === "Maternelle") {
      return form.letter ? `${form.level} ${form.letter} Maternelle` : `${form.level} Maternelle`
    }
    // Filière spécialisée sans lettre
    if (form.section === "Humanités" && STREAM_LETTER_OPTIONAL.has(form.stream) && !form.letter) {
      return `${form.level} Humanités ${form.stream}`
    }
    if (!form.letter) return ""
    let name = `${form.level} ${form.letter} ${form.section}`
    if (form.stream && form.section === "Humanités") {
      name += ` ${form.stream}`
    }
    return name
  }

  // Variables de couleur basées sur le thème
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const changeTab = (next: ClassesTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "classes") params.delete("tab")
    else params.set("tab", next)
    const qs = params.toString()
    router.replace(qs ? `/admin/classes?${qs}` : "/admin/classes", { scroll: false })
  }

  return (
    <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${textColor}`}>Classes & Filières</h1>
            <p className={textSecondary}>
              {tab === "subjects"
                ? "Gestion des matières (structure pédagogique)"
                : "Gestion des classes et filières selon le format RDC"}
            </p>
          </div>
          {tab === "classes" && (
            <button
              onClick={handleCreate}
              aria-label="Créer une classe"
              title="Créer une classe"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 p-2 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className={cn("inline-flex gap-1 rounded-xl border p-1", borderColor, theme === "dark" ? "bg-gray-800/80" : "bg-gray-100/80")}>
          <button
            type="button"
            onClick={() => changeTab("classes")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              tab === "classes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : cn(textSecondary, "hover:text-indigo-500")
            )}
          >
            Classes
          </button>
          <button
            type="button"
            onClick={() => changeTab("subjects")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              tab === "subjects"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : cn(textSecondary, "hover:text-indigo-500")
            )}
          >
            Matières
          </button>
        </div>

        {tab === "subjects" ? (
          <SubjectsSection theme={theme} />
        ) : (
        <Card theme={theme}>
          <CardHeader>
            <CardTitle>Liste des classes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: cartes compactes — nom + filière, pas de colonnes redondantes */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <p className={`py-8 text-center text-[15px] ${textSecondary}`}>Chargement...</p>
              ) : classes.length === 0 ? (
                <p className={`py-8 text-center text-[15px] ${textSecondary}`}>Aucune classe trouvée.</p>
              ) : (
                SECTION_ORDER.map((section) => {
                  const sectionClasses = classes
                    .filter((cls) => cls.section === section)
                    .sort((a, b) => {
                      const levels = LEVELS_BY_SECTION[section] ?? []
                      const ai = levels.indexOf(a.level)
                      const bi = levels.indexOf(b.level)
                      const aIdx = ai === -1 ? 999 : ai
                      const bIdx = bi === -1 ? 999 : bi
                      if (aIdx !== bIdx) return aIdx - bIdx
                      return a.letter.localeCompare(b.letter)
                    })
                  if (sectionClasses.length === 0) return null
                  const style = sectionStyles[section] ?? {
                    bg: theme === "dark" ? "bg-gray-700" : "bg-gray-100",
                    text: textColor,
                  }
                  return (
                    <div key={`m-${section}`} className="space-y-2">
                      <div className={cn("rounded-xl px-3.5 py-2.5", style.bg)}>
                        <p className={cn("text-[13px] font-semibold", style.text)}>
                          {SECTION_LABELS[section]}
                          <span className="ml-1.5 font-normal opacity-80">
                            · {sectionClasses.length} classe{sectionClasses.length > 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      {sectionClasses.map((cls) => {
                        const meta = [cls.letter ? `Div. ${cls.letter}` : null, cls.stream || null]
                          .filter(Boolean)
                          .join(" · ")
                        return (
                          <div
                            key={`m-cls-${cls.id}`}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border px-3.5 py-3.5",
                              theme === "dark" ? "border-gray-700 bg-gray-800/60" : "border-gray-200 bg-white"
                            )}
                          >
                            <Link href={`/admin/classes/${cls.id}`} className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold leading-snug text-indigo-500">
                                {cls.name}
                              </p>
                              {meta ? (
                                <p className={cn("mt-1 text-xs truncate", textSecondary)}>{meta}</p>
                              ) : null}
                            </Link>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Link
                                href={`/admin/classes/${cls.id}`}
                                className={cn(
                                  "rounded-full p-2.5 transition-colors",
                                  textSecondary,
                                  theme === "dark" ? "hover:bg-teal-900/30 hover:text-teal-400" : "hover:bg-teal-50 hover:text-teal-600"
                                )}
                                aria-label="Voir les élèves"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleEdit(cls)}
                                className={cn(
                                  "rounded-full p-2.5 transition-colors",
                                  textSecondary,
                                  theme === "dark" ? "hover:bg-indigo-900/30 hover:text-indigo-400" : "hover:bg-indigo-50 hover:text-indigo-600"
                                )}
                                aria-label="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cls)}
                                className={cn(
                                  "rounded-full p-2.5 transition-colors",
                                  textSecondary,
                                  theme === "dark" ? "hover:bg-red-900/30 hover:text-red-400" : "hover:bg-red-50 hover:text-red-600"
                                )}
                                aria-label="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Desktop: tableau complet */}
            <div className="hidden md:block overflow-x-auto">
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
                    <TableLoadingRow colSpan={7} textClassName={textSecondary} cellClassName={textSecondary} message="Chargement..." />
                  ) : (
                    <>
                      {classes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className={`px-3 py-8 text-center ${textSecondary}`}>
                            Aucune classe trouvée.
                          </td>
                        </tr>
                      ) : (
                        SECTION_ORDER.map((section) => {
                          const sectionClasses = classes
                            .filter(cls => cls.section === section)
                            .sort((a, b) => {
                              const levels = LEVELS_BY_SECTION[section] ?? []
                              const ai = levels.indexOf(a.level)
                              const bi = levels.indexOf(b.level)
                              const aIdx = ai === -1 ? 999 : ai
                              const bIdx = bi === -1 ? 999 : bi
                              if (aIdx !== bIdx) return aIdx - bIdx
                              return a.letter.localeCompare(b.letter)
                            })
                          if (sectionClasses.length === 0) return null
                          const style = sectionStyles[section] ?? { bg: theme === "dark" ? "bg-gray-700" : "bg-gray-100", text: textColor }
                          return (
                            <Fragment key={section}>
                              <tr>
                                <td colSpan={7} className={`px-3 py-2 ${style.bg}`}>
                                  <span className={style.text}>
                                    {SECTION_LABELS[section]} — {sectionClasses.length} classe{sectionClasses.length > 1 ? "s" : ""}
                                  </span>
                                </td>
                              </tr>
                              {sectionClasses.map((cls) => (
                                <tr key={cls.id} className={hoverBg}>
                                  <td className={`px-3 py-2 font-medium ${textColor}`}>
                                    <Link
                                      href={`/admin/classes/${cls.id}`}
                                      className="text-indigo-500 hover:text-indigo-400 hover:underline underline-offset-2"
                                    >
                                      {cls.name}
                                    </Link>
                                  </td>
                                  <td className={`px-3 py-2 ${textColor}`}>{cls.level}</td>
                                  <td className={`px-3 py-2 ${textColor}`}>{cls.section}</td>
                                  <td className={`px-3 py-2 ${textColor}`}>{cls.letter || "—"}</td>
                                  <td className={`px-3 py-2 ${textColor}`}>{cls.stream || "—"}</td>
                                  <td className={`px-3 py-2 ${textColor}`}>{new Date(cls.createdAt).toLocaleDateString()}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <Link
                                        href={`/admin/classes/${cls.id}`}
                                        className={`rounded-full p-2 ${textSecondary} hover:text-teal-500 ${theme === "dark" ? "hover:bg-teal-900/30" : "hover:bg-teal-50"} transition-colors`}
                                        aria-label="Voir les élèves"
                                        title="Voir les élèves"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Link>
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
                            </Fragment>
                          )
                        })
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )}

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
                    <label className={`block ${textColor} mb-1`}>Section *</label>
                    <MenuSelect
                      aria-label="Section"
                      value={form.section}
                      onChange={(v) => { setForm({ ...form, section: v, level: "", stream: "" }); setFormError(null) }}
                      placeholder="Sélectionner"
                      triggerClassName={`w-full rounded-md ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                      options={SECTION_OPTIONS}
                    />
                  </div>
                  <div>
                    <label className={`block ${textColor} mb-1`}>Niveau *</label>
                    <MenuSelect
                      aria-label="Niveau"
                      value={form.level}
                      onChange={(v) => { setForm({ ...form, level: v }); setFormError(null) }}
                      disabled={!form.section}
                      placeholder={form.section ? "Sélectionner" : "Choisir une section d'abord"}
                      triggerClassName={`w-full rounded-md ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                      options={(LEVELS_BY_SECTION[form.section] ?? []).map((lvl) => ({
                        value: lvl,
                        label: lvl,
                      }))}
                    />
                  </div>
                  <div>
                    <label className={`block ${textColor} mb-1`}>
                      Lettre{(form.section === "Maternelle" || (form.section === "Humanités" && STREAM_LETTER_OPTIONAL.has(form.stream))) ? " (optionnelle)" : " *"}
                    </label>
                    <MenuSelect
                      aria-label="Lettre"
                      value={form.letter}
                      onChange={(v) => { setForm({ ...form, letter: v }); setFormError(null) }}
                      placeholder={(form.section === "Maternelle" || (form.section === "Humanités" && STREAM_LETTER_OPTIONAL.has(form.stream))) ? "Aucune" : "Sélectionner"}
                      triggerClassName={`w-full rounded-md ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                      options={LETTER_OPTIONS}
                    />
                  </div>
                  <div>
                    <label className={`block ${textColor} mb-1`}>Filière / Option</label>
                    <MenuSelect
                      aria-label="Filière / Option"
                      value={form.stream}
                      onChange={(v) => { setForm({ ...form, stream: v }); setFormError(null) }}
                      disabled={form.section !== "Humanités"}
                      placeholder="— Aucune —"
                      triggerClassName={`w-full rounded-md ${theme === "dark" ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                      options={STREAM_OPTIONS}
                    />
                  </div>
                </div>
                
                <div className={theme === "dark" ? "bg-gray-700 p-3 rounded-md" : "bg-gray-50 p-3 rounded-md"}>
                  <div className={`text-sm ${textSecondary} mb-1`}>Aperçu du nom de la classe:</div>
                  <div className={`font-medium text-lg ${textColor}`}>{generatePreviewName() || "..."}</div>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
                    <span className="mt-0.5">&#9888;</span>
                    <span>{formError}</span>
                  </div>
                )}
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
              "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
              visibleDelete ? "opacity-100" : "opacity-0 pointer-events-none"
            )} aria-hidden={!visibleDelete}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDeleteModal} />

              <div className={cn(
                "relative w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-200",
                theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200",
                visibleDelete ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )} role="dialog" aria-modal="true">
                <div className={`border-b px-4 py-3 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <div className={`text-lg font-semibold ${textColor}`}>Confirmer la suppression</div>
                </div>

                <div className="space-y-4 p-4">
                  <div className={`rounded-lg border px-3 py-2.5 text-sm ${
                    theme === "dark"
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}>
                    Action irréversible. La classe{" "}
                    <span className="font-semibold">« {deletingClass?.name} »</span>{" "}
                    sera définitivement supprimée.
                  </div>

                  <div>
                    <label className={`mb-1.5 block text-sm font-medium ${textColor}`}>
                      Tapez le nom exact de la classe pour confirmer
                    </label>
                    <p className={`mb-2 text-xs ${textSecondary}`}>
                      Saisissez : <span className={`font-mono font-semibold ${textColor}`}>{deletingClass?.name}</span>
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmName}
                      onChange={(e) => {
                        setDeleteConfirmName(e.target.value)
                        setDeleteError(null)
                      }}
                      placeholder={deletingClass?.name || "Nom de la classe"}
                      autoComplete="off"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-red-500/40 ${
                        theme === "dark"
                          ? "border-gray-600 bg-gray-900 text-gray-100 placeholder:text-gray-500"
                          : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      }`}
                    />
                  </div>

                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
                    theme === "dark" ? "border-gray-700 bg-gray-900/40" : "border-gray-200 bg-gray-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={deleteAcknowledged}
                      onChange={(e) => {
                        setDeleteAcknowledged(e.target.checked)
                        setDeleteError(null)
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-500 text-red-600 focus:ring-red-500"
                    />
                    <span className={textSecondary}>
                      Je comprends que cette suppression est <strong className={textColor}>risquée</strong> et
                      définitive, et j&apos;approuve la suppression de cette classe.
                    </span>
                  </label>

                  {deleteError && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {deleteError}
                    </div>
                  )}
                </div>

                <div className={`flex items-center justify-end gap-2 border-t px-4 py-3 ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}>
                  <button
                    type="button"
                    className={`rounded-md border px-4 py-2 ${
                      theme === "dark"
                        ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={closeDeleteModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!canConfirmDelete}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={confirmDelete}
                  >
                    {submitting ? "Suppression..." : "Supprimer définitivement"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </div>
  )
}

