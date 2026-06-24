/** Libellé de date façon WhatsApp : Aujourd'hui, Hier, sinon jour + mois. */
export function formatRelativeDateLabel(dateInput: string | Date, now = new Date()): string {
  const d = new Date(dateInput)
  const startOf = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  const today = startOf(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const paymentDay = startOf(d)

  if (paymentDay.getTime() === today.getTime()) return "Aujourd'hui"
  if (paymentDay.getTime() === yesterday.getTime()) return "Hier"

  const day = d.getDate()
  const month = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")
  return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)}`
}

/** Colonne latérale : grand jour + mois, ou libellé relatif court. */
export function formatDateSidebar(dateInput: string | Date, now = new Date()): {
  primary: string
  secondary: string
  groupKey: string
} {
  const d = new Date(dateInput)
  const startOf = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  const today = startOf(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const paymentDay = startOf(d)
  const groupKey = paymentDay.toISOString().slice(0, 10)

  if (paymentDay.getTime() === today.getTime()) {
    return { primary: "Auj.", secondary: "", groupKey }
  }
  if (paymentDay.getTime() === yesterday.getTime()) {
    return { primary: "Hier", secondary: "", groupKey }
  }

  const day = String(d.getDate())
  const month = d
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase())

  return { primary: day, secondary: month, groupKey }
}

export function formatTimeLabel(dateInput: string | Date): string {
  return new Date(dateInput).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
