"use client"

import { useState, useEffect, useCallback } from "react"
import Layout from "@/components/layout"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import { authFetch } from "@/lib/auth-fetch"
import {
  Megaphone, Send, Clock, Eye, ChevronRight, Loader2, Trash2,
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo, Redo, Type, Check, X
} from "lucide-react"
import Link from "next/link"

interface Communique {
  id: number
  title: string
  content: string
  createdAt: string
  createdBy: { name: string; nom?: string; prenom?: string }
  _count: { reads: number }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors text-sm ${
      active
        ? "bg-indigo-600 text-white"
        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
    }`

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Annuler"><Undo className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Rétablir"><Redo className="w-4 h-4" /></button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} title="Gras"><Bold className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} title="Italique"><Italic className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))} title="Souligné"><UnderlineIcon className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))} title="Barré"><span className="w-4 h-4 text-sm font-bold line-through">S</span></button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive("heading", { level: 1 }))} title="Titre 1"><span className="text-xs font-bold">H1</span></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))} title="Titre 2"><span className="text-xs font-bold">H2</span></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))} title="Titre 3"><span className="text-xs font-bold">H3</span></button>
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={btnClass(editor.isActive("paragraph"))} title="Paragraphe"><Type className="w-4 h-4" /></button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btnClass(editor.isActive({ textAlign: "left" }))} title="Gauche"><AlignLeft className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btnClass(editor.isActive({ textAlign: "center" }))} title="Centre"><AlignCenter className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btnClass(editor.isActive({ textAlign: "right" }))} title="Droite"><AlignRight className="w-4 h-4" /></button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Liste à puces"><List className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Liste numérotée"><ListOrdered className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))} title="Citation"><span className="text-sm font-bold">&ldquo;</span></button>
    </div>
  )
}

export default function AdminCommuniquesPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [title, setTitle] = useState("")
  const [communiques, setCommuniques] = useState<Communique[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle")
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const [editorEmpty, setEditorEmpty] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setEditorEmpty(editor.getText().trim().length === 0)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[180px] p-4 outline-none focus:ring-0",
      },
    },
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)
    const handleThemeChange = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("themeChange", handleThemeChange)
    window.addEventListener("storage", handleThemeChange)
    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [])

  const fetchCommuniques = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await authFetch(`/api/admin/communiques?page=${pageNum}&limit=10`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        if (append) setCommuniques((prev) => [...prev, ...data.communiques])
        else setCommuniques(data.communiques)
        setPage(pageNum)
        setHasMore(data.hasMore)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { fetchCommuniques(1, false) }, [fetchCommuniques])

  const handleSend = async () => {
    if (!title.trim() || !editor || editorEmpty) return
    setSending(true)
    setSendStatus("idle")
    try {
      const res = await authFetch("/api/admin/communiques", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: editor.getHTML() }),
      })
      if (res.ok) {
        setSendStatus("success")
        setTitle("")
        editor.commands.clearContent()
        await fetchCommuniques(1, false)
        setTimeout(() => setSendStatus("idle"), 3000)
      } else {
        setSendStatus("error")
      }
    } catch {
      setSendStatus("error")
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`/api/admin/communiques/${id}`, { method: "DELETE", credentials: "include" })
      if (res.ok) {
        setCommuniques((prev) => prev.filter((c) => c.id !== id))
        setDeleteConfirmId(null)
      }
    } catch {}
  }

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const bgCard = theme === "dark" ? "bg-gray-800" : "bg-white"
  const bgPage = theme === "dark" ? "bg-gray-900" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const hoverBg = theme === "dark" ? "hover:bg-gray-700/40" : "hover:bg-gray-50"
  const inputBg = theme === "dark" ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  const editorBg = theme === "dark" ? "bg-gray-700/50" : "bg-white"

  const latest = communiques[0]
  const rest = communiques.slice(1)

  return (
    <Layout>
      <div className={`min-h-screen ${bgPage}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 ${bgCard} border-b ${borderColor}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${textColor}`}>Communiqués</h1>
              <p className={`text-xs ${textSecondary}`}>Envoyer des messages aux élèves</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Composer */}
          <div className={`${bgCard} border ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
            <div className={`px-5 py-4 border-b ${borderColor} flex items-center gap-2`}>
              <Send className="w-4 h-4 text-indigo-500" />
              <h2 className={`font-semibold ${textColor}`}>Nouveau communiqué</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`text-sm font-medium ${textSecondary} block mb-1.5`}>Objet <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Réunion parents d'élèves — 20 juin 2026"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-500 ${inputBg}`}
                  maxLength={200}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${textSecondary} block mb-1.5`}>Contenu <span className="text-red-500">*</span></label>
                <div className={`border ${borderColor} rounded-xl overflow-hidden ${editorBg}`}>
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  {sendStatus === "success" && (
                    <span className="flex items-center gap-1.5 text-sm text-green-500">
                      <Check className="w-4 h-4" /> Communiqué envoyé avec succès !
                    </span>
                  )}
                  {sendStatus === "error" && (
                    <span className="flex items-center gap-1.5 text-sm text-red-500">
                      <X className="w-4 h-4" /> Erreur lors de l'envoi
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !editor || editorEmpty}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </div>
          </div>

          {/* Latest communiqué */}
          {!loading && latest && (
            <div className={`${bgCard} border ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
              <div className={`px-5 py-3 border-b ${borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className={`text-sm font-semibold ${textColor}`}>Dernier communiqué</span>
                </div>
                <Link
                  href={`/admin/communiques/${latest.id}`}
                  className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  Voir complet <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="p-5">
                <h3 className={`font-semibold ${textColor} mb-1`}>{latest.title}</h3>
                <div
                  className={`text-sm ${textSecondary} line-clamp-3 prose prose-sm dark:prose-invert max-w-none`}
                  dangerouslySetInnerHTML={{ __html: latest.content }}
                />
                <div className="flex items-center gap-3 mt-3">
                  <span className={`flex items-center gap-1 text-xs ${textSecondary}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(latest.createdAt)}
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${textSecondary}`}>
                    <Eye className="w-3.5 h-3.5" />
                    {latest._count.reads} lecture{latest._count.reads !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {!loading && communiques.length > 0 && (
            <div className={`${bgCard} border ${borderColor} rounded-xl overflow-hidden shadow-sm`}>
              <div className={`px-5 py-3 border-b ${borderColor}`}>
                <h2 className={`font-semibold ${textColor}`}>Historique des communiqués</h2>
                <p className={`text-xs ${textSecondary} mt-0.5`}>{communiques.length} communiqué{communiques.length !== 1 ? "s" : ""} — du plus récent au plus ancien</p>
              </div>
              <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-100"}`}>
                {communiques.map((c) => (
                  <div
                    key={c.id}
                    className={`relative transition-colors ${theme === "dark" ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}
                  >
                    {deleteConfirmId === c.id ? (
                      <div className="flex items-center justify-between gap-2 p-4">
                        <span className={`text-sm ${textSecondary}`}>Supprimer ce communiqué ?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className={`text-sm px-3 py-1.5 rounded-lg font-medium ${theme === "dark" ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"}`}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-sm px-3 py-1.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4 p-4">
                        <div className={`p-2.5 rounded-full flex-shrink-0 ${theme === "dark" ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/admin/communiques/${c.id}`} className={`font-medium text-sm ${textColor} hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors`}>
                            {c.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`flex items-center gap-1 text-xs ${textSecondary}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(c.createdAt)}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${textSecondary}`}>
                              <Eye className="w-3 h-3" />
                              {c._count.reads} lecture{c._count.reads !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            href={`/admin/communiques/${c.id}`}
                            className={`p-1.5 rounded-lg transition-colors ${textSecondary} ${hoverBg}`}
                            title="Voir"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirmId(c.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className={`px-5 py-3 border-t ${borderColor} text-center`}>
                  <button
                    onClick={() => fetchCommuniques(page + 1, true)}
                    disabled={loadingMore}
                    className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                      theme === "dark" ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                    Charger plus
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`w-8 h-8 animate-spin ${textSecondary}`} />
            </div>
          )}

          {!loading && communiques.length === 0 && (
            <div className={`${bgCard} border ${borderColor} rounded-xl p-12 text-center`}>
              <Megaphone className={`w-14 h-14 mx-auto mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`font-medium ${textColor}`}>Aucun communiqué pour le moment</p>
              <p className={`text-sm ${textSecondary} mt-1`}>Rédigez votre premier communiqué ci-dessus.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
