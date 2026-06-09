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
      <div className="flex-1">
        <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600/60 text-white rounded-xl font-semibold text-sm cursor-not-allowed">
          <Download className="w-4 h-4 flex-shrink-0" />
          Chargement…
        </button>
      </div>
    ),
  }
)

export default function InvoiceDownloadButton({ data, className }: { data: InvoiceData; className?: string }) {
  return (
    <div className="flex-1">
      <InvoiceDownloadInner
        data={data}
        className={className ?? "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"}
      />
    </div>
  )
}
