"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import type { ReceiptData } from "@/components/receipt-pdf"
import { cn } from "@/lib/utils"

export default function StudentReceiptDownload({
  paiementId,
  className,
}: {
  paiementId: number
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/fees/paiements/${paiementId}/receipt`, { credentials: "include" })
      if (!res.ok) throw new Error("Erreur")
      const { data } = await res.json()
      const Receipt = (await import("@/components/receipt-pdf")).default
      const receiptData: ReceiptData = {
        ...data,
        datePaiement: typeof data.datePaiement === "string" ? data.datePaiement : new Date(data.datePaiement).toISOString(),
        devise: data.devise as "USD" | "CDF",
      }
      const blob = await pdf(<Receipt data={receiptData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `recu-${data.numeroRecu}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Impossible de télécharger le reçu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10",
        className
      )}
      aria-label="Télécharger le reçu"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </button>
  )
}
