"use client"

import { useEffect, useState, useCallback } from "react"
import { Wallet, CheckCircle, AlertCircle, Receipt, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/use-student-theme"
import StudentLoading from "@/components/student/student-loading"
import StudentReceiptDownload from "@/components/student/student-receipt-download"

interface Balance {
  usd: { totalDu: number; totalPaye: number; solde: number }
  cdf: { totalDu: number; totalPaye: number; solde: number }
}

interface Paiement {
  id: number
  numeroRecu: string
  montant: number
  devise: string
  typeFrais: string
  datePaiement: string
  modePaiement: string
}

function formatMoney(amount: number, devise: string) {
  const symbol = devise === "CDF" ? "FC" : "$"
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: devise === "CDF" ? 0 : 2, maximumFractionDigits: devise === "CDF" ? 0 : 2 })} ${symbol}`
}

function mergeBalance(balance: Balance | null) {
  if (!balance) return { totalDu: 0, totalPaye: 0, solde: 0, devise: "USD" as const }

  const { usd, cdf } = balance
  const hasUsd = usd.totalDu > 0 || usd.totalPaye > 0
  const hasCdf = cdf.totalDu > 0 || cdf.totalPaye > 0

  if (hasCdf && !hasUsd) return { ...cdf, devise: "CDF" as const }
  if (hasUsd && !hasCdf) return { ...usd, devise: "USD" as const }
  if (hasCdf && hasUsd) return { ...cdf, devise: "CDF" as const }
  return { ...usd, devise: "USD" as const }
}

export default function StudentFeesPage() {
  const { card, text, textMuted, shadow, border, isDark } = useStudentTheme()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [paymentToast, setPaymentToast] = useState<string | null>(null)

  const fetchFees = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/student/fees", { credentials: "include" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setPaiements(data.paiements || [])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchFees()
    const onPayment = () => {
      fetchFees(true)
      setPaymentToast("Nouveau paiement enregistré !")
      setTimeout(() => setPaymentToast(null), 4000)
    }
    window.addEventListener("feePaymentReceived", onPayment)
    return () => window.removeEventListener("feePaymentReceived", onPayment)
  }, [fetchFees])

  if (loading) return <StudentLoading />

  const summary = mergeBalance(balance)
  const cdfSummary = balance?.cdf

  return (
    <div className="space-y-5">
      {paymentToast && (
        <div className="rounded-2xl bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {paymentToast}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold tracking-tight", text)}>Frais scolaires</h1>
          <p className={cn("mt-1 text-sm", textMuted)}>Gérez vos paiements et consultez votre solde</p>
        </div>
        {refreshing && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
      </div>

      <div className={cn("relative overflow-hidden rounded-2xl border p-5", card, border, shadow)}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
            <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
            Annuel
          </span>
        </div>
        <p className={cn("text-[11px] font-semibold uppercase tracking-wider", textMuted)}>Total à payer</p>
        <p className={cn("mt-1 text-3xl font-bold tracking-tight", text)}>
          {formatMoney(summary.totalDu, summary.devise)}
        </p>
        {cdfSummary && cdfSummary.totalDu > 0 && summary.devise === "USD" && (
          <p className={cn("mt-1 text-sm", textMuted)}>+ {formatMoney(cdfSummary.totalDu, "CDF")}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", textMuted)}>Payé</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatMoney(summary.totalPaye, summary.devise)}</p>
        </div>
        <div className={cn("rounded-2xl border p-4", card, border, shadow)}>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", textMuted)}>Solde</p>
          <p className="mt-1 text-xl font-bold text-red-500">{formatMoney(summary.solde, summary.devise)}</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={cn("text-base font-bold", text)}>Historique des paiements</h2>
        </div>

        {paiements.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center",
              isDark ? "border-gray-700 bg-gray-900/50" : "border-indigo-100 bg-indigo-50/40"
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800">
              <Receipt className="h-6 w-6 text-indigo-400" />
            </div>
            <p className={cn("text-sm font-semibold", text)}>Aucun paiement enregistré</p>
            <p className={cn("mt-2 max-w-xs text-xs leading-relaxed", textMuted)}>
              Vos paiements apparaîtront ici dès qu&apos;ils seront enregistrés par l&apos;administration.
            </p>
          </div>
        ) : (
          <div className={cn("space-y-2 overflow-hidden rounded-2xl border", card, border, shadow)}>
            {paiements.map((p) => (
              <div key={p.id} className={cn("border-b p-4 last:border-0", border)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-semibold", text)}>{p.typeFrais}</p>
                    <p className={cn("text-xs", textMuted)}>Reçu n° {p.numeroRecu}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-bold text-green-600">{formatMoney(p.montant, p.devise)}</p>
                    <StudentReceiptDownload paiementId={p.id} />
                  </div>
                </div>
                <p className={cn("mt-1 text-xs", textMuted)}>
                  {new Date(p.datePaiement).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-lg shadow-indigo-600/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Important</p>
          <p className="mt-1 text-xs leading-relaxed text-indigo-100">
            Les frais scolaires doivent être réglés avant la date limite fixée par l&apos;administration. Vous serez
            notifié dès qu&apos;un paiement est enregistré.
          </p>
        </div>
      </div>
    </div>
  )
}
