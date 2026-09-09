"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import Portal from "@/components/portal"
import { TableLoadingBlock, TableLoadingRow } from "@/components/ui/table-loading"
import { Toolbar, Pagination } from "./students-section"
import { authFetch } from "@/lib/auth-fetch"
import { toast } from "sonner"
import {
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Search,
  User,
  Users,
  X,
} from "lucide-react"

type ParentLink = {
  id: number
  relationship: string | null
  isPrimaryContact?: boolean
  student: {
    id: number
    code: string
    lastName: string
    middleName: string
    firstName: string
    gender?: string
  }
}

type ParentItem = {
  id: number
  lastName: string
  middleName: string | null
  firstName: string
  phone: string | null
  userId: number
  childrenCount?: number
  user: { id: number; email: string; isActive?: boolean }
  students: ParentLink[]
}

type ParentLookupItem = {
  id: number
  name: string
  lastName: string
  middleName: string | null
  firstName: string
  phone: string | null
  email: string
  childrenCount: number
}

type StudentOption = {
  id: number
  code: string
  lastName: string
  middleName: string
  firstName: string
}

type CredentialsPayload = {
  email: string
  plaintextPassword: string
  lastName: string
  middleName?: string | null
  firstName: string
  phone?: string | null
  childrenCount?: number
}

interface PaginationState {
  page: number
  pageSize: number
}

function fullName(p: { lastName?: string | null; middleName?: string | null; firstName?: string | null }) {
  return [p.lastName, p.middleName, p.firstName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    void navigator.clipboard.writeText(value)
    return
  }
  const textArea = document.createElement("textarea")
  textArea.value = value
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand("copy")
  document.body.removeChild(textArea)
}

export function ParentsSection({ theme }: { theme: "light" | "dark" }) {
  const [items, setItems] = useState<ParentItem[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 })
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ParentItem | null>(null)
  const [mobileExpandedId, setMobileExpandedId] = useState<number | null>(null)

  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedForCredentials, setSelectedForCredentials] = useState<ParentItem | null>(null)
  const [newPasswordGenerated, setNewPasswordGenerated] = useState("")
  const [resetting, setResetting] = useState(false)
  const [credentialsMode, setCredentialsMode] = useState<"create" | "reset">("reset")
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      params.set("page", String(pagination.page))
      params.set("pageSize", String(pagination.pageSize))
      const r = await authFetch(`/api/admin/parents?${params.toString()}`)
      const res = await r.json().catch(() => ({ items: [], total: 0 }))
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination, q])

  useEffect(() => {
    void load()
  }, [load])

  const closeCredentials = () => {
    setShowResetConfirm(false)
    setSelectedForCredentials(null)
    setNewPasswordGenerated("")
    setCredentialsMode("reset")
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  const openResetConfirm = (parent: ParentItem) => {
    setSelectedForCredentials(parent)
    setCredentialsMode("reset")
    setNewPasswordGenerated("")
    setShowResetConfirm(true)
    setPasswordCopied(false)
    setEmailCopied(false)
  }

  const handleConfirmReset = async () => {
    if (!selectedForCredentials) return
    try {
      setResetting(true)
      const res = await authFetch(`/api/admin/parents/${selectedForCredentials.id}/reset-password`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        setNewPasswordGenerated(data.newPassword)
        setSelectedForCredentials({
          ...selectedForCredentials,
          user: { ...selectedForCredentials.user, email: data.parent.email },
        })
        setShowResetConfirm(false)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Erreur lors de la réinitialisation")
        closeCredentials()
      }
    } catch {
      toast.error("Une erreur est survenue")
      closeCredentials()
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle>Parents</CardTitle>
        <p className={`text-sm ${textSecondary}`}>
          Créez des comptes parents et liez un ou plusieurs élèves pour le suivi (frais, messages).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Toolbar
          placeholder="Rechercher par nom, téléphone ou email"
          onCreate={() => setShowCreate(true)}
          onSearch={setQ}
          theme={theme}
          isSearching={loading}
        />

        <div className="md:hidden space-y-2.5">
          {loading && <TableLoadingBlock textClassName={textSecondary} message="Chargement..." />}
          {!loading &&
            items.map((p) => {
              const name = fullName(p)
              const initials =
                `${(p.firstName?.[0] || "").toUpperCase()}${(p.lastName?.[0] || "").toUpperCase()}` || "?"
              const open = mobileExpandedId === p.id
              return (
                <div
                  key={`mobile-parent-${p.id}`}
                  className={`overflow-hidden rounded-2xl border ${borderColor} ${bgCard} shadow-sm`}
                >
                  <button
                    type="button"
                    onClick={() => setMobileExpandedId(open ? null : p.id)}
                    className={`flex w-full items-center gap-3 p-3.5 text-left ${hoverBg}`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        theme === "dark"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[15px] font-semibold ${textColor}`}>{name || "—"}</div>
                      <div className={`mt-0.5 truncate text-xs ${textSecondary}`}>
                        {p.students.length} enfant{p.students.length !== 1 ? "s" : ""}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </div>
                    </div>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        theme === "dark" ? "bg-gray-700/60 text-gray-300" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                    </span>
                  </button>
                  {open && (
                    <div className={`space-y-2.5 border-t ${borderColor} px-3.5 py-3`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className={textSecondary}>Email</span>
                        <span className={`max-w-[60%] truncate font-medium ${textColor}`}>{p.user.email}</span>
                      </div>
                      <div className={`rounded-xl border ${borderColor} p-2.5`}>
                        <p className={`mb-1.5 text-xs font-medium ${textSecondary}`}>Enfants liés</p>
                        {p.students.length === 0 ? (
                          <p className={`text-sm ${textSecondary}`}>Aucun élève assigné</p>
                        ) : (
                          <ul className="space-y-1">
                            {p.students.map((link) => (
                              <li key={link.id} className={`text-sm ${textColor}`}>
                                {fullName(link.student)}
                                <span className={textSecondary}> · {link.student.code}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => openResetConfirm(p)}
                          className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 ${borderColor} ${textColor}`}
                          title="Réinitialiser le mot de passe"
                        >
                          <KeyRound className="h-4 w-4 text-orange-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          {!loading && items.length === 0 && (
            <div className={`rounded-2xl border ${borderColor} p-8 text-center`}>
              <Users className={`mx-auto mb-2 h-8 w-8 ${textSecondary}`} />
              <p className={`font-medium ${textColor}`}>Aucun parent</p>
              <p className={`mt-1 text-sm ${textSecondary}`}>
                Créez un compte et assignez les élèves concernés.
              </p>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`border-b ${borderColor} text-left ${textSecondary}`}>
                <th className="px-3 py-2 font-medium">Nom</th>
                <th className="px-3 py-2 font-medium">Téléphone</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Enfants</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableLoadingRow colSpan={5} textClassName={textSecondary} />}
              {!loading &&
                items.map((p) => (
                  <tr key={p.id} className={`border-b ${borderColor} ${hoverBg}`}>
                    <td className={`px-3 py-2.5 font-medium ${textColor}`}>{fullName(p)}</td>
                    <td className={`px-3 py-2.5 ${textSecondary}`}>{p.phone || "—"}</td>
                    <td className={`px-3 py-2.5 ${textSecondary}`}>{p.user.email}</td>
                    <td className={`px-3 py-2.5 ${textColor}`}>
                      {p.students.length === 0 ? (
                        <span className={textSecondary}>0</span>
                      ) : (
                        <span title={p.students.map((l) => fullName(l.student)).join(", ")}>
                          {p.students.length}{" "}
                          <span className={textSecondary}>
                            (
                            {p.students
                              .slice(0, 2)
                              .map((l) => l.student.firstName)
                              .join(", ")}
                            {p.students.length > 2 ? "…" : ""})
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Modifier"
                          onClick={() => setEditing(p)}
                          className={`rounded-lg p-1.5 ${hoverBg} ${textSecondary}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Réinitialiser le mot de passe"
                          onClick={() => openResetConfirm(p)}
                          className={`rounded-lg p-1.5 ${hoverBg}`}
                        >
                          <KeyRound className="h-4 w-4 text-orange-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className={`px-3 py-10 text-center ${textSecondary}`}>
                    Aucun parent enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination state={pagination} setState={setPagination} total={total} />

        <ParentFormModal
          open={showCreate || !!editing}
          mode={editing ? "edit" : "create"}
          initial={editing}
          theme={theme}
          onClose={() => {
            setShowCreate(false)
            setEditing(null)
          }}
          onSaved={(payload) => {
            const wasCreate = showCreate && !editing
            setShowCreate(false)
            setEditing(null)
            if (payload?.email && payload?.plaintextPassword) {
              setSelectedForCredentials({
                id: 0,
                lastName: payload.lastName,
                middleName: payload.middleName || null,
                firstName: payload.firstName,
                phone: payload.phone || null,
                userId: 0,
                user: { id: 0, email: payload.email },
                students: [],
                childrenCount: payload.childrenCount || 0,
              })
              setNewPasswordGenerated(payload.plaintextPassword)
              setCredentialsMode("create")
              setShowResetConfirm(false)
              setPasswordCopied(false)
              setEmailCopied(false)
            } else {
              toast.success(wasCreate ? "Parent existant mis à jour" : "Parent mis à jour")
            }
            void load()
          }}
        />

        {/* Modal confirmation reset MDP — style élèves / enseignants */}
        {showResetConfirm && !newPasswordGenerated && selectedForCredentials && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCredentials} />
              <div
                className={`relative w-full max-w-md transform rounded-2xl border shadow-2xl transition-all duration-200 ${
                  theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                }`}
              >
                <div className={`border-b p-6 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <h3
                    className={`flex items-center gap-2 text-xl font-bold ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    <KeyRound className="h-5 w-5 text-orange-500" />
                    Réinitialiser le mot de passe
                  </h3>
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                        theme === "dark"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {selectedForCredentials.firstName?.charAt(0)}
                      {selectedForCredentials.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {fullName(selectedForCredentials)}
                      </p>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {selectedForCredentials.phone || "Parent"}
                      </p>
                    </div>
                  </div>
                  <p className={`mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Êtes-vous sûr de vouloir réinitialiser le mot de passe de ce parent ?
                  </p>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Un nouveau mot de passe temporaire sera généré. Le parent pourra le changer lors de sa
                    prochaine connexion.
                  </p>
                </div>
                <div
                  className={`flex gap-3 border-t p-6 ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={closeCredentials}
                    disabled={resetting}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
                      theme === "dark"
                        ? "border border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={resetting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    {resetting ? "Réinitialisation..." : "Réinitialiser"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}

        {/* Modal identifiants — même design que élèves / enseignants */}
        {newPasswordGenerated && selectedForCredentials && (
          <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCredentials} />
              <div
                className={`relative w-full max-w-lg transform rounded-2xl border shadow-2xl transition-all duration-200 ${
                  theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                }`}
              >
                <div
                  className={`border-b p-6 ${
                    theme === "dark"
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20">
                      <KeyRound className="h-7 w-7 text-green-500" />
                    </div>
                    <div>
                      <h2
                        className={`text-lg font-bold ${
                          theme === "dark" ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Identifiants de Connexion
                      </h2>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        {credentialsMode === "create"
                          ? "Compte créé avec succès"
                          : "Mot de passe réinitialisé avec succès"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div
                    className={`rounded-lg border p-4 ${
                      theme === "dark"
                        ? "border-yellow-500/30 bg-yellow-500/10"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <p
                      className={`flex items-start gap-2 text-sm font-medium ${
                        theme === "dark" ? "text-yellow-400" : "text-yellow-700"
                      }`}
                    >
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        <strong>Important :</strong> Copiez ces identifiants maintenant ! Ils ne seront plus
                        affichés après la fermeture.
                      </span>
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-3 rounded-lg p-3 ${
                      theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        theme === "dark"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        {fullName(selectedForCredentials)}
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Parent
                        {typeof selectedForCredentials.childrenCount === "number"
                          ? ` · ${selectedForCredentials.childrenCount} enfant${
                              selectedForCredentials.childrenCount !== 1 ? "s" : ""
                            }`
                          : selectedForCredentials.students.length > 0
                            ? ` · ${selectedForCredentials.students.length} enfant${
                                selectedForCredentials.students.length !== 1 ? "s" : ""
                              }`
                            : ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Adresse email
                    </label>
                    <div
                      className={`flex items-center justify-between rounded-lg border-2 p-3 transition-all hover:border-indigo-500 ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      } ${
                        emailCopied
                          ? "border-green-500"
                          : theme === "dark"
                            ? "border-gray-600"
                            : "border-gray-200"
                      }`}
                    >
                      <span
                        className={`select-all font-mono text-sm ${
                          theme === "dark" ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {selectedForCredentials.user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyText(selectedForCredentials.user.email)
                          setEmailCopied(true)
                          setTimeout(() => setEmailCopied(false), 2000)
                        }}
                        className={`rounded p-1.5 transition-colors ${
                          emailCopied
                            ? "bg-green-500/20 text-green-500"
                            : "text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400"
                        }`}
                        title={emailCopied ? "Copié !" : "Copier l'email"}
                      >
                        {emailCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      {credentialsMode === "create" ? "Mot de passe temporaire" : "Nouveau mot de passe"}
                    </label>
                    <div
                      className={`flex items-center justify-between rounded-lg border-2 p-3 transition-all hover:border-orange-500 ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      } ${
                        passwordCopied
                          ? "border-green-500"
                          : theme === "dark"
                            ? "border-gray-600"
                            : "border-gray-200"
                      }`}
                    >
                      <span
                        className={`select-all font-mono text-lg font-bold ${
                          theme === "dark" ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {newPasswordGenerated}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyText(newPasswordGenerated)
                          setPasswordCopied(true)
                          setTimeout(() => setPasswordCopied(false), 2000)
                        }}
                        className={`rounded p-1.5 transition-colors ${
                          passwordCopied
                            ? "bg-green-500/20 text-green-500"
                            : "text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
                        }`}
                        title={passwordCopied ? "Copié !" : "Copier le mot de passe"}
                      >
                        {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Le parent devra changer ce mot de passe lors de sa prochaine connexion.
                  </p>
                </div>

                <div className={`border-t p-6 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    type="button"
                    onClick={closeCredentials}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      passwordCopied && emailCopied
                        ? theme === "dark"
                          ? "border border-green-500/70 bg-green-500/30 text-green-300 hover:bg-green-500/40"
                          : "border border-green-300 bg-green-100 text-green-700 hover:bg-green-200"
                        : theme === "dark"
                          ? "border border-green-500/50 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "border border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    {passwordCopied && emailCopied
                      ? "✓ Identifiants copiés !"
                      : "J'ai copié les identifiants"}
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </CardContent>
    </Card>
  )
}

function ParentFormModal({
  open,
  mode,
  initial,
  theme,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: "create" | "edit"
  initial: ParentItem | null
  theme: "light" | "dark"
  onClose: () => void
  onSaved: (payload?: CredentialsPayload) => void
}) {
  type CreateStep = "search" | "form"
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createStep, setCreateStep] = useState<CreateStep>("search")
  const [lookupForm, setLookupForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
  })
  const [lookupResults, setLookupResults] = useState<ParentLookupItem[]>([])
  const [lookupSearched, setLookupSearched] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [existingParentId, setExistingParentId] = useState<number | null>(null)
  const [form, setForm] = useState({
    lastName: "",
    middleName: "",
    firstName: "",
    phone: "",
    relationship: "Parent",
  })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [primaryByStudentId, setPrimaryByStudentId] = useState<Record<number, boolean>>({})
  const [studentQ, setStudentQ] = useState("")
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const borderColor = theme === "dark" ? "border-gray-600" : "border-gray-300"
  const bgInput = theme === "dark" ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"
  const isLinkExisting = mode === "create" && existingParentId != null

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

  useEffect(() => {
    if (!open) return
    setCreateStep(mode === "create" ? "search" : "form")
    setLookupForm({ lastName: "", firstName: "", phone: "", email: "" })
    setLookupResults([])
    setLookupSearched(false)
    setLookupLoading(false)
    setExistingParentId(null)
    setStudentQ("")
    setSubmitting(false)
    if (mode === "edit" && initial) {
      setForm({
        lastName: initial.lastName || "",
        middleName: initial.middleName || "",
        firstName: initial.firstName || "",
        phone: initial.phone || "",
        relationship: initial.students[0]?.relationship || "Parent",
      })
      setSelectedIds(initial.students.map((s) => s.student.id))
      const primaryMap: Record<number, boolean> = {}
      for (const link of initial.students) {
        primaryMap[link.student.id] = Boolean(link.isPrimaryContact)
      }
      setPrimaryByStudentId(primaryMap)
    } else {
      setForm({
        lastName: "",
        middleName: "",
        firstName: "",
        phone: "",
        relationship: "Parent",
      })
      setSelectedIds([])
      setPrimaryByStudentId({})
    }
  }, [open, mode, initial])

  useEffect(() => {
    if (!open || (mode === "create" && createStep === "search")) return
    let cancelled = false
    const run = async () => {
      setLoadingStudents(true)
      try {
        const params = new URLSearchParams()
        params.set("page", "1")
        params.set("pageSize", "50")
        if (studentQ.trim()) params.set("q", studentQ.trim())
        const r = await authFetch(`/api/admin/students?${params.toString()}`)
        const data = await r.json().catch(() => ({ items: [] }))
        if (!cancelled) {
          setStudentOptions(
            (data.items || []).map((s: any) => ({
              id: s.id,
              code: s.code || s.displayCode || "",
              lastName: s.lastName,
              middleName: s.middleName,
              firstName: s.firstName,
            }))
          )
        }
      } catch {
        if (!cancelled) setStudentOptions([])
      } finally {
        if (!cancelled) setLoadingStudents(false)
      }
    }
    const t = setTimeout(run, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, studentQ, mode, createStep])

  const selectedLabels = useMemo(() => {
    const map = new Map<number, StudentOption>()
    for (const s of studentOptions) map.set(s.id, s)
    if (initial) {
      for (const link of initial.students) {
        map.set(link.student.id, {
          id: link.student.id,
          code: link.student.code,
          lastName: link.student.lastName,
          middleName: link.student.middleName,
          firstName: link.student.firstName,
        })
      }
    }
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as StudentOption[]
  }, [selectedIds, studentOptions, initial])

  if (!mounted) return null

  const canSearchLookup =
    lookupForm.lastName.trim().length > 0 ||
    lookupForm.firstName.trim().length > 0 ||
    lookupForm.phone.trim().length > 0 ||
    lookupForm.email.trim().length > 0

  const canSubmit = form.lastName.trim().length > 0 && form.firstName.trim().length > 0

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setPrimaryByStudentId((map) => {
          const next = { ...map }
          delete next[id]
          return next
        })
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  const buildStudentsPayload = () =>
    selectedIds.map((studentId) => ({
      studentId,
      relationship: form.relationship || null,
      isPrimaryContact: Boolean(primaryByStudentId[studentId]),
    }))

  const runLookup = async () => {
    if (!canSearchLookup || lookupLoading) return
    setLookupLoading(true)
    setLookupSearched(true)
    try {
      const params = new URLSearchParams()
      params.set("lookup", "1")
      params.set("page", "1")
      params.set("pageSize", "20")
      if (lookupForm.lastName.trim()) params.set("lastName", lookupForm.lastName.trim())
      if (lookupForm.firstName.trim()) params.set("firstName", lookupForm.firstName.trim())
      if (lookupForm.phone.trim()) params.set("phone", lookupForm.phone.trim())
      if (lookupForm.email.trim()) params.set("email", lookupForm.email.trim())
      const r = await authFetch(`/api/admin/parents?${params.toString()}`)
      const data = await r.json().catch(() => ({ items: [] }))
      setLookupResults(data.items || [])
    } catch {
      setLookupResults([])
      toast.error("Erreur lors de la recherche")
    } finally {
      setLookupLoading(false)
    }
  }

  const selectExistingParent = async (match: ParentLookupItem) => {
    setSubmitting(true)
    try {
      const r = await authFetch(`/api/admin/parents/${match.id}`)
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || "Impossible de charger le parent")
      const parent = data.parent as ParentItem
      setExistingParentId(parent.id)
      setForm({
        lastName: parent.lastName || "",
        middleName: parent.middleName || "",
        firstName: parent.firstName || "",
        phone: parent.phone || "",
        relationship: parent.students?.[0]?.relationship || "Parent",
      })
      setSelectedIds((parent.students || []).map((s) => s.student.id))
      const primaryMap: Record<number, boolean> = {}
      for (const link of parent.students || []) {
        primaryMap[link.student.id] = Boolean(link.isPrimaryContact)
      }
      setPrimaryByStudentId(primaryMap)
      setCreateStep("form")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const proceedToCreate = () => {
    setExistingParentId(null)
    setForm({
      lastName: lookupForm.lastName.trim(),
      middleName: "",
      firstName: lookupForm.firstName.trim(),
      phone: lookupForm.phone.trim(),
      relationship: "Parent",
    })
    setSelectedIds([])
    setPrimaryByStudentId({})
    setCreateStep("form")
  }

  const submit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const students = buildStudentsPayload()
      if (mode === "create" && !isLinkExisting) {
        const res = await authFetch("/api/admin/parents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastName: form.lastName,
            middleName: form.middleName,
            firstName: form.firstName,
            phone: form.phone,
            relationship: form.relationship,
            students,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur")
        onSaved({
          email: data.user.email,
          plaintextPassword: data.plaintextPassword,
          lastName: form.lastName,
          middleName: form.middleName,
          firstName: form.firstName,
          phone: form.phone,
          childrenCount: selectedIds.length,
        })
      } else {
        const parentId = isLinkExisting ? existingParentId! : initial!.id
        const res = await authFetch(`/api/admin/parents/${parentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lastName: form.lastName,
            middleName: form.middleName,
            firstName: form.firstName,
            phone: form.phone,
            relationship: form.relationship,
            students,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur")
        onSaved()
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const title =
    mode === "edit"
      ? "Modifier le parent"
      : createStep === "search"
        ? "Rechercher un parent"
        : isLinkExisting
          ? "Lier des élèves à un parent existant"
          : "Nouveau compte parent"

  const subtitle =
    mode === "edit"
      ? "Assignez un ou plusieurs élèves pour le suivi scolaire"
      : createStep === "search"
        ? "Vérifiez d’abord si le parent existe déjà (nom, téléphone, email)"
        : isLinkExisting
          ? "Mettez à jour les informations et les élèves liés"
          : "Créez le compte et assignez les élèves"

  return (
    <Portal>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div
          className={`relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-200 ${
            theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          } ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`flex items-center justify-between border-b px-5 py-4 ${
              theme === "dark"
                ? "border-indigo-500/20 bg-indigo-500/5"
                : "border-indigo-100 bg-indigo-50/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  theme === "dark" ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100 text-indigo-600"
                }`}
              >
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
                <p className={`text-xs ${textSecondary}`}>{subtitle}</p>
              </div>
            </div>
            <button type="button" className={textSecondary} onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto p-5">
            {mode === "create" && createStep === "search" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Nom</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={lookupForm.lastName}
                      onChange={(e) => setLookupForm({ ...lookupForm, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Prénom</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={lookupForm.firstName}
                      onChange={(e) => setLookupForm({ ...lookupForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Téléphone</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={lookupForm.phone}
                      onChange={(e) => setLookupForm({ ...lookupForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Email</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={lookupForm.email}
                      onChange={(e) => setLookupForm({ ...lookupForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!canSearchLookup || lookupLoading}
                    onClick={() => void runLookup()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" />
                    {lookupLoading ? "Recherche…" : "Rechercher"}
                  </button>
                  <button
                    type="button"
                    onClick={proceedToCreate}
                    className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${borderColor} ${textColor}`}
                  >
                    Créer sans rechercher
                  </button>
                </div>

                {lookupSearched && (
                  <div className={`rounded-2xl border p-3 ${borderColor}`}>
                    <p className={`mb-2 text-sm font-semibold ${textColor}`}>
                      Résultats ({lookupResults.length})
                    </p>
                    {lookupResults.length === 0 ? (
                      <div className="space-y-3 py-2 text-center">
                        <p className={`text-sm ${textSecondary}`}>Aucun parent trouvé</p>
                        <button
                          type="button"
                          onClick={proceedToCreate}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Créer un nouveau compte
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-56 space-y-1.5 overflow-y-auto">
                        {lookupResults.map((match) => (
                          <button
                            key={match.id}
                            type="button"
                            disabled={submitting}
                            onClick={() => void selectExistingParent(match)}
                            className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${borderColor} ${
                              theme === "dark" ? "hover:bg-gray-700/80" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className={`truncate font-medium ${textColor}`}>{match.name}</p>
                              <p className={`truncate text-xs ${textSecondary}`}>
                                {[match.phone, match.email].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                            <span className={`shrink-0 text-xs ${textSecondary}`}>
                              {match.childrenCount} enfant{match.childrenCount !== 1 ? "s" : ""}
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={proceedToCreate}
                          className={`mt-2 w-full rounded-lg border border-dashed px-3 py-2 text-sm ${borderColor} ${textSecondary}`}
                        >
                          Aucune correspondance — créer un nouveau compte
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {mode === "create" && (
                  <button
                    type="button"
                    onClick={() => {
                      setExistingParentId(null)
                      setCreateStep("search")
                    }}
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-indigo-300" : "text-indigo-600"
                    }`}
                  >
                    ← Retour à la recherche
                  </button>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Post-nom</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={form.middleName}
                      onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Téléphone</label>
                    <input
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`mb-1 block text-sm ${textSecondary}`}>Lien de parenté</label>
                    <select
                      className={`w-full rounded-lg border px-3 py-2 text-sm ${borderColor} ${bgInput}`}
                      value={form.relationship}
                      onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    >
                      <option value="Parent">Parent</option>
                      <option value="Père">Père</option>
                      <option value="Mère">Mère</option>
                      <option value="Tuteur">Tuteur</option>
                      <option value="Tutrice">Tutrice</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className={`rounded-2xl border p-3 ${borderColor}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <User className={`h-4 w-4 ${textSecondary}`} />
                    <p className={`text-sm font-semibold ${textColor}`}>
                      Élèves assignés ({selectedIds.length})
                    </p>
                  </div>

                  {selectedLabels.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {selectedLabels.map((s) => (
                        <div
                          key={`sel-${s.id}`}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2.5 py-2 ${borderColor}`}
                        >
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${textColor}`}>{fullName(s)}</p>
                            <p className={`text-xs ${textSecondary}`}>{s.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label
                              className={`inline-flex items-center gap-1.5 text-xs ${textSecondary}`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(primaryByStudentId[s.id])}
                                onChange={(e) =>
                                  setPrimaryByStudentId((prev) => ({
                                    ...prev,
                                    [s.id]: e.target.checked,
                                  }))
                                }
                                className="rounded border-gray-400"
                              />
                              Contact principal
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleStudent(s.id)}
                              className={`rounded p-1 ${textSecondary}`}
                              title="Retirer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative mb-2">
                    <Search
                      className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`}
                    />
                    <input
                      className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm ${borderColor} ${bgInput}`}
                      placeholder="Rechercher un élève à lier…"
                      value={studentQ}
                      onChange={(e) => setStudentQ(e.target.value)}
                    />
                  </div>

                  <div
                    className={`max-h-48 space-y-1 overflow-y-auto rounded-xl border ${borderColor} p-1.5`}
                  >
                    {loadingStudents && (
                      <p className={`px-2 py-3 text-center text-sm ${textSecondary}`}>Chargement…</p>
                    )}
                    {!loadingStudents && studentOptions.length === 0 && (
                      <p className={`px-2 py-3 text-center text-sm ${textSecondary}`}>
                        Aucun élève trouvé
                      </p>
                    )}
                    {!loadingStudents &&
                      studentOptions.map((s) => {
                        const checked = selectedIds.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleStudent(s.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                              checked
                                ? theme === "dark"
                                  ? "bg-indigo-500/15"
                                  : "bg-indigo-50"
                                : theme === "dark"
                                  ? "hover:bg-gray-700/80"
                                  : "hover:bg-gray-50"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded border ${
                                checked ? "border-indigo-500 bg-indigo-500 text-white" : borderColor
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate font-medium ${textColor}`}>
                                {fullName(s)}
                              </span>
                              <span className={`block text-xs ${textSecondary}`}>{s.code}</span>
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              </>
            )}
          </div>

          {!(mode === "create" && createStep === "search") && (
            <div
              className={`flex items-center justify-end gap-2 border-t px-5 py-3 ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${borderColor} ${textColor}`}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={submit}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting
                  ? "Enregistrement…"
                  : isLinkExisting
                    ? "Mettre à jour les liens"
                    : mode === "create"
                      ? "Créer le compte"
                      : "Enregistrer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
