"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"
import StudentReceiptModal from "./student-receipt-modal"

export default function StudentReceiptDownload({
  paiementId,
  className,
}: {
  paiementId: number
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10",
          className
        )}
        aria-label="Voir et télécharger le reçu"
      >
        <Download className="h-4 w-4" />
      </button>

      {open && <StudentReceiptModal paiementId={paiementId} onClose={() => setOpen(false)} />}
    </>
  )
}
