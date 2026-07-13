"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Receipt,
  Loader2,
  X,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTeacherTheme } from "@/components/teacher/use-teacher-theme"
import StudentLoading from "@/components/student/student-loading"

interface Payment {
  id: number
  montant: number
  type: string
  typeLabel: string
  mois: string | null
  description: string | null
  modePaiement: string
  reference: string | null
  datePaiement: string
  invoiceNumber: string
}

interface Invoice {
  invoiceNumber: string
  montant: number
  devise: string
  typeLabel: string
  mois: string | null
  description: string | null
  modeLabel: string
  reference: string | null
  datePaiement: string
  staffName: string
  roleLabel: string | null
  schoolName: string | null
  schoolAddress: string | null
  schoolPhone: string | null
  schoolEmail: string | null
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default function StaffWalletPage() {
  const { card, text, textMuted, shadow, border, isDark } = useTeacherTheme()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  const fetchPayments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/staff/payments", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchPayments()
    const onPayment = () => {
      void fetchPayments(true)
      setToast("Nouveau paiement reçu !")
      setTimeout(() => setToast(null), 4000)
    }
    window.addEventListener("staffPaymentReceived", onPayment)
    return () => window.removeEventListener("staffPaymentReceived", onPayment)
  }, [fetchPayments])

  const openInvoice = async (id: number) => {
    setLoadingInvoice(true)
    setInvoiceOpen(true)
    try {
      const res = await fetch(`/api/staff/payments/${id}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
      }
    } finally {
      setLoadingInvoice(false)
    }
  }

  if (loading) return <StudentLoading variant="fees" />

  return (
    <div className="space-y-5 lg:space-y-8">
      {toast && (
        <div className="rounded-2xl bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight lg:text-3xl", text)}>Portefeuille</h1>
          <p className={cn("mt-1 text-sm lg:text-base", textMuted)}>Historique des paiements de salaire.</p>
        </div>
        {refreshing && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
      </div>

      <section>
        <h2 className={cn("mb-3 text-base font-bold", text)}>Historique des paiements</h2>
        {payments.length === 0 ? (
          <div className={cn("rounded-2xl border p-10 text-center", card, border, shadow)}>
            <Receipt className="mx-auto mb-3 h-10 w-10 text-indigo-500/50" />
            <p className={cn("font-medium", text)}>Aucun paiement enregistré</p>
            <p className={cn("mt-1 text-sm", textMuted)}>Vos paiements apparaîtront ici dès réception.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openInvoice(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-transform active:scale-[0.99]",
                  card,
                  border,
                  shadow
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn("truncate font-semibold", text)}>{p.typeLabel}</p>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600")}>
                      {p.invoiceNumber}
                    </span>
                  </div>
                  <p className={cn("text-xs", textMuted)}>
                    {formatDate(p.datePaiement)}
                    {p.mois ? ` · ${p.mois}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-green-600">{formatMoney(p.montant)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {invoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setInvoiceOpen(false)}>
          <div
            className={cn("max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-xl", card, border)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn("text-lg font-bold", text)}>Facture de paiement</h3>
              <button type="button" onClick={() => setInvoiceOpen(false)} className={textMuted}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {loadingInvoice ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : invoice ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{invoice.invoiceNumber}</p>
                  <p className={cn("mt-1 text-2xl font-bold", text)}>{formatMoney(invoice.montant)}</p>
                  <p className={cn("text-sm", textMuted)}>{invoice.typeLabel}</p>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Bénéficiaire</p>
                    <p className={cn("font-medium", text)}>{invoice.staffName}</p>
                    {invoice.roleLabel && <p className={textMuted}>{invoice.roleLabel}</p>}
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Date</p>
                    <p className={cn("font-medium", text)}>{formatDate(invoice.datePaiement)}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Mode</p>
                    <p className={cn("font-medium", text)}>{invoice.modeLabel}</p>
                  </div>
                  {invoice.reference && (
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Référence</p>
                      <p className={cn("font-medium", text)}>{invoice.reference}</p>
                    </div>
                  )}
                  {invoice.mois && (
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Période</p>
                      <p className={cn("font-medium", text)}>{invoice.mois}</p>
                    </div>
                  )}
                </div>
                {invoice.description && (
                  <div>
                    <p className={cn("text-[10px] font-bold uppercase", textMuted)}>Description</p>
                    <p className={cn("text-sm", text)}>{invoice.description}</p>
                  </div>
                )}
                {invoice.schoolName && (
                  <div className={cn("border-t pt-3 text-xs", isDark ? "border-gray-800" : "border-gray-100", textMuted)}>
                    <p className="font-semibold text-foreground">{invoice.schoolName}</p>
                    {invoice.schoolAddress && <p>{invoice.schoolAddress}</p>}
                    {invoice.schoolPhone && <p>{invoice.schoolPhone}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className={cn("py-8 text-center", textMuted)}>Facture introuvable</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
