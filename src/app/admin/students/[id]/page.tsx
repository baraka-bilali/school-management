"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Layout from "@/components/layout"
import { authFetch } from "@/lib/auth-fetch"
import {
  User, Mail, Phone, MapPin, BookOpen, Users,
  Heart, ArrowLeft, ChevronDown, ChevronUp, Edit,
  Upload, QrCode, X, Save,
} from "lucide-react"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false }
)

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentDetails {
  id: number
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  birthDate: string
  birthPlace: string | null
  nationality: string | null
  address: string | null
  photoUrl: string | null
  parentName1: string | null
  parentPhone1: string | null
  parentJob1: string | null
  parentEmail1: string | null
  parentName2: string | null
  parentPhone2: string | null
  parentJob2: string | null
  parentEmail2: string | null
  bloodGroup: string | null
  allergies: string | null
  medicalNotes: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  user: {
    email: string
    telephone: string | null
    isActive: boolean
    school: { nomEtablissement: string } | null
  }
  enrollments: Array<{
    id: number
    status: string
    class: { id: number; name: string; level: string; section: string; stream: string | null }
    year: { id: number; name: string }
  }>
}

export interface EditData {
  code: string
  lastName: string
  middleName: string
  firstName: string
  gender: string
  birthDate: string
  birthPlace: string
  nationality: string
  address: string
  photoUrl: string | null
  parentName1: string
  parentPhone1: string
  parentJob1: string
  parentEmail1: string
  parentName2: string
  parentPhone2: string
  parentJob2: string
  parentEmail2: string
  bloodGroup: string
  allergies: string
  medicalNotes: string
  emergencyContact: string
  emergencyPhone: string
  classId: string
  yearId: string
}

// ─── StudentField — defined OUTSIDE parent so React never remounts it ─────────

interface StudentFieldProps {
  label: string
  editKey: keyof EditData
  value: string | null
  editData: EditData | null
  editMode: boolean
  onFieldChange: (field: keyof EditData, value: string) => void
  type?: string
  rows?: number
  colSpan?: boolean
  icon?: React.ReactNode
  inputCls: string
  labelCls: string
  txt: string
  txtSec: string
}

function StudentField({
  label, editKey, value, editData, editMode, onFieldChange,
  type = "text", rows, colSpan, icon, inputCls, labelCls, txt, txtSec,
}: StudentFieldProps) {
  return (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <label className={`${labelCls}${icon ? " flex items-center gap-1.5" : ""}`}>
        {icon}{label}
      </label>
      {editMode && editData ? (
        rows ? (
          <textarea
            rows={rows}
            value={(editData[editKey] as string) || ""}
            onChange={(e) => onFieldChange(editKey, e.target.value)}
            className={inputCls}
          />
        ) : (
          <input
            type={type}
            value={(editData[editKey] as string) || ""}
            onChange={(e) => onFieldChange(editKey, e.target.value)}
            className={inputCls}
          />
        )
      ) : (
        <p className={`text-sm ${value ? `${txt} font-medium` : `${txtSec} italic`}`}>
          {value || "Non renseigne"}
        </p>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Edit
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<EditData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)


  // QR
  const [showQR, setShowQR] = useState(false)

  // Sections
  const [openSections, setOpenSections] = useState({
    identification: true,
    administratif: true,
    coordonnees: false,
    parents: false,
    medical: false,
  })

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    if (saved) setTheme(saved)
    const handler = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("storage", handler)
    window.addEventListener("themeChange", handler)
    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener("themeChange", handler)
    }
  }, [])

  useEffect(() => {
    fetchStudent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchStudent = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch(`/api/admin/students/${params.id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setStudent(data.student)
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        setError(err.error || "Impossible de charger les donnees")
      }
    } catch {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (s: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }))

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })

  // ── Edit ────────────────────────────────────────────────────────────────────

  const startEdit = () => {
    if (!student) return
    setEditData({
      code: student.code,
      lastName: student.lastName,
      middleName: student.middleName,
      firstName: student.firstName,
      gender: student.gender,
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      birthPlace: student.birthPlace || "",
      nationality: student.nationality || "",
      address: student.address || "",
      photoUrl: student.photoUrl || null,
      parentName1: student.parentName1 || "",
      parentPhone1: student.parentPhone1 || "",
      parentJob1: student.parentJob1 || "",
      parentEmail1: student.parentEmail1 || "",
      parentName2: student.parentName2 || "",
      parentPhone2: student.parentPhone2 || "",
      parentJob2: student.parentJob2 || "",
      parentEmail2: student.parentEmail2 || "",
      bloodGroup: student.bloodGroup || "",
      allergies: student.allergies || "",
      medicalNotes: student.medicalNotes || "",
      emergencyContact: student.emergencyContact || "",
      emergencyPhone: student.emergencyPhone || "",
      classId: student.enrollments[0]?.class?.id?.toString() || "",
      yearId: student.enrollments[0]?.year?.id?.toString() || "",
    })
    setEditMode(true)
    setOpenSections({ identification: true, administratif: true, coordonnees: true, parents: true, medical: true })
  }

  const cancelEdit = () => { setEditMode(false); setEditData(null); setSaveError(null) }

  const setField = (field: keyof EditData, value: string) =>
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev))

  const saveEdit = async () => {
    if (!editData || !student) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await authFetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        const data = await res.json()
        setStudent(data.student)
        setEditMode(false)
        setEditData(null)
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        setSaveError(err.error || "Erreur lors de la sauvegarde")
      }
    } catch {
      setSaveError("Erreur de connexion")
    } finally {
      setSaving(false)
    }
  }

  // ── Photo ───────────────────────────────────────────────────────────────────

  const buildPhotoPayload = (base64: string) => {
    if (!student) return null
    return {
      code: student.code, lastName: student.lastName, middleName: student.middleName,
      firstName: student.firstName, gender: student.gender,
      birthDate: student.birthDate.split("T")[0],
      birthPlace: student.birthPlace, nationality: student.nationality, address: student.address,
      photoUrl: base64,
      parentName1: student.parentName1, parentPhone1: student.parentPhone1,
      parentJob1: student.parentJob1, parentEmail1: student.parentEmail1,
      parentName2: student.parentName2, parentPhone2: student.parentPhone2,
      parentJob2: student.parentJob2, parentEmail2: student.parentEmail2,
      bloodGroup: student.bloodGroup, allergies: student.allergies,
      medicalNotes: student.medicalNotes, emergencyContact: student.emergencyContact,
      emergencyPhone: student.emergencyPhone,
      classId: student.enrollments[0]?.class?.id?.toString(),
      yearId: student.enrollments[0]?.year?.id?.toString(),
    }
  }

  const savePhoto = async (base64: string) => {
    if (!student) return
    setSaving(true)
    try {
      const payload = buildPhotoPayload(base64)
      const res = await authFetch(`/api/admin/students/${student.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setStudent(data.student)
      }
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = e.target?.result as string
      if (!b64) return
      const img = new Image()
      img.onload = async () => {
        const c = document.createElement("canvas")
        const maxSize = 400
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        c.width = Math.round(img.width * ratio)
        c.height = Math.round(img.height * ratio)
        const ctx = c.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, c.width, c.height)
          await savePhoto(c.toDataURL("image/jpeg", 0.85))
        }
      }
      img.src = b64
    }
    reader.readAsDataURL(file)
  }

  // ── QR ──────────────────────────────────────────────────────────────────────

  const downloadQR = () => {
    const svgEl = document.getElementById("student-qr-svg")
    if (!svgEl) return
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `qr-${student?.code || "eleve"}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Theme shortcuts ──────────────────────────────────────────────────────────

  const dark = theme === "dark"
  const cardBg = dark ? "bg-gray-800" : "bg-white"
  const border = dark ? "border-gray-700" : "border-gray-200"
  const txt = dark ? "text-gray-100" : "text-gray-900"
  const txtSec = dark ? "text-gray-400" : "text-gray-600"
  const txtMut = dark ? "text-gray-500" : "text-gray-500"
  const hover = dark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    dark ? "bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 focus:border-indigo-500"
  }`
  const labelCls = `text-xs ${txtMut} mb-1 block`

  // Shared props for StudentField — stable object via useMemo is NOT needed
  // because the component is defined outside, so it keeps its DOM identity.
  const fieldProps = { editData, editMode, onFieldChange: setField, inputCls, labelCls, txt, txtSec }

  // ── Loading / Error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 140px)" }}>
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={`text-sm ${txtSec}`}>Chargement...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !student) {
    return (
      <Layout>
        <div className="flex items-center justify-center" style={{ height: "calc(100vh - 140px)" }}>
          <div className="text-center p-8">
            <p className={`${txt} text-xl font-semibold mb-2`}>{error || "Eleve introuvable"}</p>
            <button onClick={() => router.push("/admin/users")} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              Retour a la liste
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const enrollment = student.enrollments[0]

  return (
    <Layout>
      {/* ──────────────────── QR modal ──────────────────── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowQR(false)}>
          <div className={`${cardBg} rounded-2xl p-6 w-full max-w-xs shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-semibold ${txt}`}>Code QR</h3>
              <button onClick={() => setShowQR(false)} className={`p-1 rounded-lg ${hover}`}>
                <X className={`w-5 h-5 ${txtSec}`} />
              </button>
            </div>
            <div className="flex justify-center bg-white p-4 rounded-xl mb-4">
              <QRCodeSVG
                id="student-qr-svg"
                value={`STUDENT:${student.code}:${student.id}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="H"
              />
            </div>
            <p className={`text-xs ${txtMut} text-center mb-4`}>
              Matricule : <span className="font-mono font-semibold">{student.code}</span>
            </p>
            <button onClick={downloadQR} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm">
              Telecharger (SVG)
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────── Page content ──────────────────── */}
      <div className="p-6 space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/users")} className={`p-2 rounded-lg ${hover} transition-colors ${txt}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${txt}`}>Fiche eleve</h1>
              <p className={`text-xs ${txtSec} mt-0.5`}>{student.lastName} {student.firstName} - {student.code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={cancelEdit} className={`px-4 py-2 rounded-lg font-medium text-sm ${dark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                  Annuler
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" />{saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </>
            ) : (
              <button onClick={startEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2">
                <Edit className="w-4 h-4" />Modifier
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {saveError}
          </div>
        )}

        {/* Profile card */}
        <div className={`${cardBg} rounded-xl border ${border} p-5`}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar with photo/camera controls */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow ring-2 ring-indigo-200 dark:ring-indigo-800">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold select-none">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                )}
              </div>
              {/* Hover overlay — import photo */}
              <label title="Changer la photo" className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Upload className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = "" }} />
              </label>
              {saving && (
                <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <h2 className={`text-xl font-bold ${txt}`}>
                {student.lastName}{" "}
                {student.middleName && <span className="font-normal">{student.middleName} </span>}
                {student.firstName}
              </h2>
              <p className={`text-sm ${txtSec} mt-0.5`}>
                Matricule : <span className="font-mono font-semibold">{student.code}</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${student.user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                  {student.user.isActive ? "Actif" : "Inactif"}
                </span>
                {enrollment && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {enrollment.class.name} - {enrollment.year.name}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  {student.gender === "M" ? "Garcon" : "Fille"}
                </span>
              </div>
            </div>

            {/* QR button */}
            <button onClick={() => setShowQR(true)} title="Code QR"
              className={`flex-shrink-0 p-3 rounded-xl border ${border} ${hover} transition-colors flex flex-col items-center gap-1 ${txtSec}`}>
              <QrCode className="w-5 h-5" />
              <span className="text-xs">QR</span>
            </button>
          </div>
        </div>

        {/* ── Section: Identification ── */}
        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
          <button onClick={() => toggleSection("identification")} className={`w-full px-5 py-4 flex items-center justify-between ${hover} transition-colors`}>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-indigo-500" />
              <span className={`text-sm font-semibold ${txt}`}>Informations d'identification</span>
            </div>
            {openSections.identification ? <ChevronUp className={`w-4 h-4 ${txtSec}`} /> : <ChevronDown className={`w-4 h-4 ${txtSec}`} />}
          </button>
          {openSections.identification && (
            <div className={`px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t ${border}`}>
              <StudentField {...fieldProps} label="Nom" editKey="lastName" value={student.lastName} />
              <StudentField {...fieldProps} label="Post-nom" editKey="middleName" value={student.middleName} />
              <StudentField {...fieldProps} label="Prenom" editKey="firstName" value={student.firstName} />
              <div>
                <label className={labelCls}>Sexe</label>
                {editMode && editData ? (
                  <select value={editData.gender} onChange={(e) => setField("gender", e.target.value)} className={inputCls}>
                    <option value="M">Masculin</option>
                    <option value="F">Feminin</option>
                  </select>
                ) : (
                  <p className={`text-sm ${txt} font-medium`}>{student.gender === "M" ? "Masculin" : "Feminin"}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Date de naissance</label>
                {editMode && editData ? (
                  <input type="date" value={editData.birthDate} onChange={(e) => setField("birthDate", e.target.value)} className={inputCls} />
                ) : (
                  <p className={`text-sm ${txt} font-medium`}>{formatDate(student.birthDate)}</p>
                )}
              </div>
              <StudentField {...fieldProps} label="Lieu de naissance" editKey="birthPlace" value={student.birthPlace} />
              <StudentField {...fieldProps} label="Nationalite" editKey="nationality" value={student.nationality} />
              <StudentField {...fieldProps} label="N° Matricule" editKey="code" value={student.code} />
            </div>
          )}
        </div>

        {/* ── Section: Administratif scolaire ── */}
        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
          <button onClick={() => toggleSection("administratif")} className={`w-full px-5 py-4 flex items-center justify-between ${hover} transition-colors`}>
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-semibold ${txt}`}>Informations administratives scolaires</span>
            </div>
            {openSections.administratif ? <ChevronUp className={`w-4 h-4 ${txtSec}`} /> : <ChevronDown className={`w-4 h-4 ${txtSec}`} />}
          </button>
          {openSections.administratif && (
            <div className={`px-5 pb-5 pt-4 border-t ${border}`}>
              {enrollment ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Classe</label><p className={`text-sm ${txt} font-medium`}>{enrollment.class.name}</p></div>
                  <div><label className={labelCls}>Niveau</label><p className={`text-sm ${txt} font-medium`}>{enrollment.class.level}</p></div>
                  <div><label className={labelCls}>Section</label><p className={`text-sm ${txt} font-medium`}>{enrollment.class.section}</p></div>
                  <div><label className={labelCls}>Option / Filiere</label><p className={`text-sm ${txt} font-medium`}>{enrollment.class.stream || "-"}</p></div>
                  <div><label className={labelCls}>Annee scolaire</label><p className={`text-sm ${txt} font-medium`}>{enrollment.year.name}</p></div>
                  <div><label className={labelCls}>Etablissement</label><p className={`text-sm ${txt} font-medium`}>{student.user.school?.nomEtablissement || "-"}</p></div>
                  <div><label className={labelCls}>Statut d inscription</label><p className={`text-sm ${txt} font-medium`}>{enrollment.status}</p></div>
                </div>
              ) : (
                <p className={`text-sm ${txtSec} italic`}>Aucune inscription enregistree.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Section: Coordonnees ── */}
        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
          <button onClick={() => toggleSection("coordonnees")} className={`w-full px-5 py-4 flex items-center justify-between ${hover} transition-colors`}>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-semibold ${txt}`}>Coordonnees</span>
            </div>
            {openSections.coordonnees ? <ChevronUp className={`w-4 h-4 ${txtSec}`} /> : <ChevronDown className={`w-4 h-4 ${txtSec}`} />}
          </button>
          {openSections.coordonnees && (
            <div className={`px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t ${border}`}>
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}><Mail className="w-3.5 h-3.5" />Email</label>
                <p className={`text-sm ${txt} font-medium`}>{student.user.email}</p>
              </div>
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}><Phone className="w-3.5 h-3.5" />Telephone</label>
                <p className={`text-sm ${student.user.telephone ? `${txt} font-medium` : `${txtSec} italic`}`}>
                  {student.user.telephone || "Non renseigne"}
                </p>
              </div>
              <StudentField {...fieldProps} label="Adresse complete" editKey="address" value={student.address}
                rows={3} colSpan icon={<MapPin className="w-3.5 h-3.5" />} />
            </div>
          )}
        </div>

        {/* ── Section: Parents / Tuteurs ── */}
        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
          <button onClick={() => toggleSection("parents")} className={`w-full px-5 py-4 flex items-center justify-between ${hover} transition-colors`}>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-orange-500" />
              <span className={`text-sm font-semibold ${txt}`}>Parents / Tuteurs</span>
            </div>
            {openSections.parents ? <ChevronUp className={`w-4 h-4 ${txtSec}`} /> : <ChevronDown className={`w-4 h-4 ${txtSec}`} />}
          </button>
          {openSections.parents && (
            <div className={`px-5 pb-5 pt-4 border-t ${border} space-y-5`}>
              <div>
                <p className={`text-xs font-semibold ${txtSec} uppercase tracking-wide mb-3 flex items-center gap-2`}>
                  <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs flex items-center justify-center font-bold">1</span>
                  Responsable 1
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StudentField {...fieldProps} label="Nom complet" editKey="parentName1" value={student.parentName1} />
                  <StudentField {...fieldProps} label="Profession" editKey="parentJob1" value={student.parentJob1} />
                  <StudentField {...fieldProps} label="Telephone" editKey="parentPhone1" value={student.parentPhone1} type="tel" />
                  <StudentField {...fieldProps} label="Email" editKey="parentEmail1" value={student.parentEmail1} type="email" />
                </div>
              </div>
              <div className={`pt-5 border-t ${border}`}>
                <p className={`text-xs font-semibold ${txtSec} uppercase tracking-wide mb-3 flex items-center gap-2`}>
                  <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 text-xs flex items-center justify-center font-bold">2</span>
                  Responsable 2
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StudentField {...fieldProps} label="Nom complet" editKey="parentName2" value={student.parentName2} />
                  <StudentField {...fieldProps} label="Profession" editKey="parentJob2" value={student.parentJob2} />
                  <StudentField {...fieldProps} label="Telephone" editKey="parentPhone2" value={student.parentPhone2} type="tel" />
                  <StudentField {...fieldProps} label="Email" editKey="parentEmail2" value={student.parentEmail2} type="email" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Medical ── */}
        <div className={`${cardBg} rounded-xl border ${border} overflow-hidden`}>
          <button onClick={() => toggleSection("medical")} className={`w-full px-5 py-4 flex items-center justify-between ${hover} transition-colors`}>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-red-500" />
              <span className={`text-sm font-semibold ${txt}`}>Informations medicales</span>
            </div>
            {openSections.medical ? <ChevronUp className={`w-4 h-4 ${txtSec}`} /> : <ChevronDown className={`w-4 h-4 ${txtSec}`} />}
          </button>
          {openSections.medical && (
            <div className={`px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t ${border}`}>
              <div>
                <label className={labelCls}>Groupe sanguin</label>
                {editMode && editData ? (
                  <select value={editData.bloodGroup || ""} onChange={(e) => setField("bloodGroup", e.target.value)} className={inputCls}>
                    <option value="">- Selectionner -</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <p className={`text-sm ${student.bloodGroup ? `${txt} font-medium` : `${txtSec} italic`}`}>
                    {student.bloodGroup || "Non renseigne"}
                  </p>
                )}
              </div>
              <StudentField {...fieldProps} label="Allergies connues" editKey="allergies" value={student.allergies} />
              <StudentField {...fieldProps} label="Notes medicales / Conditions a surveiller" editKey="medicalNotes"
                value={student.medicalNotes} rows={3} colSpan />
              <StudentField {...fieldProps} label="Contact en cas d urgence" editKey="emergencyContact" value={student.emergencyContact} />
              <StudentField {...fieldProps} label="Telephone d urgence" editKey="emergencyPhone" value={student.emergencyPhone} type="tel" />
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
