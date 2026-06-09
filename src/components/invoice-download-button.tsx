"use client"

import dynamic from "next/dynamic"
import { Download } from "lucide-react"
import type { InvoiceData } from "./subscription-invoice-pdf"

export type { InvoiceData }

const InvoiceDownloadInner = dynamic(
  () => import("./invoice-download-button-inner"),
  {
    ssr: false,
    loading: () => (
      <button disabled className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600/60 text-white rounded-xl font-semibold cursor-not-allowed">
        <Download className="w-4 h-4" />
        Chargement…
      </button>
    ),
  }
)

export default function InvoiceDownloadButton({ data, className }: { data: InvoiceData; className?: string }) {
  return (
    <InvoiceDownloadInner
      data={data}
      className={className ?? "flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"}
    />
  )
}
