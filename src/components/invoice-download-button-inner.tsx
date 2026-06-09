"use client"

import { useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import SubscriptionInvoicePDF, { type InvoiceData } from "./subscription-invoice-pdf"
import { Download } from "lucide-react"

export default function InvoiceDownloadButton({ data, className }: { data: InvoiceData; className?: string }) {
  const [ready, setReady] = useState(false)

  return (
    <PDFDownloadLink
      document={<SubscriptionInvoicePDF data={data} />}
      fileName={`${data.numeroFacture}.pdf`}
      onLoadSuccess={() => setReady(true)}
    >
      {({ loading }) => (
        <button
          className={className}
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          {loading ? "Génération PDF…" : "Télécharger PDF"}
        </button>
      )}
    </PDFDownloadLink>
  )
}
