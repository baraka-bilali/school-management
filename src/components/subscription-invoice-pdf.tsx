import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

export interface InvoiceData {
  numeroFacture: string
  createdAt: string
  plan: string
  periode: string
  dateDebut: string
  dateFin: string
  montant: number
  devise: string
  typePaiement: string
  reference?: string | null
  notes?: string | null
  schoolName: string
  schoolCode?: string | null
  createdByName?: string | null
}

const periodeLabel: Record<string, string> = {
  MENSUEL: "Mensuel", TRIMESTRIEL: "Trimestriel",
  SEMESTRIEL: "Semestriel", ANNUEL: "Annuel",
}

const typePaiementLabel: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money", VIREMENT: "Virement bancaire",
  ESPECES: "Espèces", CARTE: "Carte bancaire",
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

const fmtAmount = (n: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(n)

const s = StyleSheet.create({
  page:        { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1f2937", backgroundColor: "#ffffff" },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  title:       { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#111827", letterSpacing: 2 },
  invoiceNum:  { fontSize: 13, color: "#2563eb", fontFamily: "Helvetica", marginTop: 4 },
  labelSmall:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bold:        { fontFamily: "Helvetica-Bold", color: "#111827" },
  normal:      { color: "#4b5563", marginTop: 2 },
  parties:     { flexDirection: "row", gap: 32, marginBottom: 32 },
  partyBlock:  { flex: 1 },
  tableWrap:   { backgroundColor: "#f9fafb", borderRadius: 8, padding: 16, marginBottom: 24 },
  tableHead:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid", paddingBottom: 8, marginBottom: 8 },
  tableRow:    { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderBottomStyle: "solid", paddingVertical: 12 },
  tableFooter: { flexDirection: "row", paddingTop: 10 },
  colDesc:     { flex: 1 },
  colAmt:      { width: 120, textAlign: "right" },
  descMain:    { fontFamily: "Helvetica-Bold", color: "#111827", fontSize: 10 },
  descSub:     { color: "#6b7280", fontSize: 9, marginTop: 3 },
  amtNormal:   { fontFamily: "Helvetica-Bold", color: "#111827", fontSize: 12 },
  amtTotal:    { fontFamily: "Helvetica-Bold", color: "#0d9488", fontSize: 14 },
  metaRow:     { flexDirection: "row", gap: 32, marginBottom: 16 },
  metaBlock:   { flex: 1 },
  notesBox:    { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a", borderStyle: "solid", borderRadius: 6, padding: 10, marginBottom: 16 },
  notesLabel:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  notesText:   { fontSize: 9, color: "#78350f" },
  footer:      { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid", textAlign: "center", color: "#9ca3af", fontSize: 9 },
  badge:       { backgroundColor: "#0d9488", borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", marginTop: 4 },
  badgeText:   { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
})

export default function SubscriptionInvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document
      title={`Facture ${data.numeroFacture}`}
      author="DigiSchool Platform"
      subject="Facture abonnement"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>FACTURE</Text>
            <Text style={s.invoiceNum}>{data.numeroFacture}</Text>
            <View style={s.badge}><Text style={s.badgeText}>DigiSchool</Text></View>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={s.labelSmall}>Date d'émission</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{fmt(data.createdAt)}</Text>
            <Text style={[s.labelSmall, { marginTop: 12 }]}>Statut</Text>
            <Text style={[s.bold, { color: "#0d9488" }]}>Payé</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyBlock}>
            <Text style={s.labelSmall}>Émetteur</Text>
            <Text style={s.bold}>DigiSchool Platform</Text>
            <Text style={s.normal}>support@digischool.com</Text>
            {data.createdByName && (
              <Text style={s.normal}>Enregistré par : {data.createdByName}</Text>
            )}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.labelSmall}>Destinataire</Text>
            <Text style={s.bold}>{data.schoolName}</Text>
            {data.schoolCode && (
              <Text style={s.normal}>Code : {data.schoolCode}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tableHead}>
            <Text style={[s.labelSmall, s.colDesc]}>Description</Text>
            <Text style={[s.labelSmall, s.colAmt]}>Montant</Text>
          </View>
          <View style={s.tableRow}>
            <View style={s.colDesc}>
              <Text style={s.descMain}>
                Abonnement {data.plan} — {periodeLabel[data.periode] || data.periode}
              </Text>
              <Text style={s.descSub}>
                Période : {fmt(data.dateDebut)} → {fmt(data.dateFin)}
              </Text>
            </View>
            <View style={s.colAmt}>
              <Text style={s.amtNormal}>
                {fmtAmount(data.montant)} {data.devise}
              </Text>
            </View>
          </View>
          <View style={s.tableFooter}>
            <Text style={[s.bold, s.colDesc, { fontSize: 11 }]}>TOTAL</Text>
            <View style={s.colAmt}>
              <Text style={s.amtTotal}>
                {fmtAmount(data.montant)} {data.devise}
              </Text>
            </View>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.labelSmall}>Mode de paiement</Text>
            <Text style={s.bold}>{typePaiementLabel[data.typePaiement] || data.typePaiement}</Text>
          </View>
          {data.reference && (
            <View style={s.metaBlock}>
              <Text style={s.labelSmall}>Référence</Text>
              <Text style={[s.bold, { fontFamily: "Courier" }]}>{data.reference}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text>Merci de votre confiance — DigiSchool Platform</Text>
          <Text style={{ marginTop: 3 }}>Ce document tient lieu de facture officielle</Text>
        </View>
      </Page>
    </Document>
  )
}
