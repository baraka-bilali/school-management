"use client"

import { PDFDownloadLink } from "@react-pdf/renderer"
import ReceiptPDF, { type ReceiptData } from "./receipt-pdf"
import { Download, Loader2 } from "lucide-react"

export default function ReceiptDownloadButton({
  data,
  className,
}: {
  data: ReceiptData
  className?: string
}) {
  return (
    <PDFDownloadLink
      document={<ReceiptPDF data={data} />}
      fileName={`recu-${data.numeroRecu}.pdf`}
    >
      {({ loading }) => (
        <button className={className} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Génération…</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Télécharger PDF</span>
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  )
}
