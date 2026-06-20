"use client"

import { useEffect, useState } from "react"
import { Receipt, X, Loader2 } from "lucide-react"
import Portal from "@/components/portal"
import ReceiptDownloadButton from "@/components/receipt-download-button"
import type { ReceiptData } from "@/components/receipt-pdf"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "./use-student-theme"

const modePaiementLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  AUTRE: "Autre",
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

function formatMontant(amount: number, devise: "USD" | "CDF") {
  const suffix = devise === "CDF" ? " FC" : " $"
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: devise === "CDF" ? 0 : 2,
    maximumFractionDigits: devise === "CDF" ? 0 : 2,
  }).format(amount) + suffix
}

interface StudentReceiptModalProps {
  paiementId: number
  onClose: () => void
}

export default function StudentReceiptModal({ paiementId, onClose }: StudentReceiptModalProps) {
  const { isDark } = useStudentTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/student/fees/paiements/${paiementId}/receipt`, { credentials: "include" })
        if (!res.ok) throw new Error("Impossible de charger le reçu")
        const { data } = await res.json()
        if (cancelled) return
        setReceiptData({
          ...data,
          datePaiement:
            typeof data.datePaiement === "string"
              ? data.datePaiement
              : new Date(data.datePaiement).toISOString(),
          devise: data.devise as "USD" | "CDF",
        })
      } catch {
        if (!cancelled) setError("Impossible de générer le reçu. Réessayez.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [paiementId])

  const bg = isDark ? "bg-[#1a1f2e]" : "bg-white"
  const border = isDark ? "border-gray-700" : "border-gray-200"
  const text = isDark ? "text-white" : "text-gray-900"
  const sub = isDark ? "text-gray-400" : "text-gray-500"
  const rowBg = isDark ? "bg-gray-800/50" : "bg-gray-50"
  const totalBg = isDark ? "bg-green-900/30" : "bg-green-50"

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div
          className={cn("relative flex w-full max-w-md flex-col rounded-2xl border shadow-2xl animate-scale-up", bg, border)}
          style={{ maxHeight: "88vh" }}
        >
          <div className={cn("flex flex-shrink-0 items-center justify-between border-b p-5", border)}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <Receipt className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className={cn("text-base font-bold", text)}>Reçu de paiement</h3>
                {receiptData ? (
                  <p className="font-mono text-xs text-green-600">{receiptData.numeroRecu}</p>
                ) : (
                  <p className={cn("text-xs", sub)}>Préparation du document…</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {receiptData && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-500">
                  Payé
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  isDark ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className={cn("text-sm", sub)}>Génération du reçu en cours…</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {receiptData && !loading && (
              <div className="space-y-4">
                {(receiptData.logoUrl || receiptData.sealUrl) && (
                  <div className="flex items-center justify-between gap-3">
                    {receiptData.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={receiptData.logoUrl} alt="Logo" className="h-12 max-w-[120px] object-contain" />
                    ) : <span />}
                    {receiptData.sealUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={receiptData.sealUrl} alt="Sceau" className="h-14 w-14 object-contain opacity-90" />
                    ) : null}
                  </div>
                )}
                <div className={cn("flex items-center justify-between border-b pb-3 text-sm", border)}>
                  <span className={sub}>Date d&apos;émission</span>
                  <span className={cn("font-semibold", text)}>{fmt(receiptData.datePaiement)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn("rounded-xl p-3", rowBg)}>
                    <p className={cn("mb-1.5 text-[10px] font-bold uppercase tracking-wider", sub)}>École</p>
                    <p className={cn("text-sm font-bold", text)}>{receiptData.schoolName}</p>
                  </div>
                  <div className={cn("rounded-xl p-3", rowBg)}>
                    <p className={cn("mb-1.5 text-[10px] font-bold uppercase tracking-wider", sub)}>Élève</p>
                    <p className={cn("text-sm font-bold", text)}>{receiptData.eleve.nom}</p>
                    <p className={cn("mt-0.5 text-xs", sub)}>Code {receiptData.eleve.code}</p>
                  </div>
                </div>

                <div className={cn("overflow-hidden rounded-xl border", border)}>
                  <div className={cn("flex justify-between border-b px-4 py-2", rowBg, border)}>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", sub)}>Description</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", sub)}>Montant</span>
                  </div>
                  <div className={cn("flex items-start justify-between border-b px-4 py-3", border)}>
                    <div>
                      <p className={cn("text-sm font-semibold", text)}>{receiptData.typeFrais}</p>
                      <p className={cn("mt-0.5 text-xs", sub)}>
                        {receiptData.classe} · {receiptData.anneeScolaire}
                      </p>
                    </div>
                    <p className={cn("ml-3 whitespace-nowrap text-sm font-bold", text)}>
                      {formatMontant(receiptData.montant, receiptData.devise)}
                    </p>
                  </div>
                  <div className={cn("flex items-center justify-between px-4 py-2.5", totalBg)}>
                    <span className={cn("text-sm font-bold", text)}>TOTAL</span>
                    <span className="text-base font-bold text-green-600">
                      {formatMontant(receiptData.montant, receiptData.devise)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-wider", sub)}>Mode de paiement</p>
                    <p className={cn("font-semibold", text)}>
                      {modePaiementLabel[receiptData.modePaiement] || receiptData.modePaiement}
                    </p>
                  </div>
                  {receiptData.reference && (
                    <div>
                      <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-wider", sub)}>Référence</p>
                      <p className={cn("font-mono font-semibold", text)}>{receiptData.reference}</p>
                    </div>
                  )}
                </div>

                <p className={cn("pt-1 text-center text-[11px]", sub)}>
                  Merci de votre confiance — {receiptData.schoolName}
                </p>
              </div>
            )}
          </div>

          <div className={cn("flex flex-shrink-0 gap-3 border-t p-4", border)}>
            {receiptData ? (
              <ReceiptDownloadButton
                data={receiptData}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              />
            ) : (
              <button
                type="button"
                disabled
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600/50 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                isDark
                  ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
