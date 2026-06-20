import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

export interface ReceiptData {
  numeroRecu: string
  datePaiement: string
  montant: number
  devise: "USD" | "CDF"
  modePaiement: string
  reference: string | null
  eleve: { code: string; nom: string }
  classe: string
  typeFrais: string
  anneeScolaire: string
  notes: string | null
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
  schoolEmail?: string | null
  logoUrl?: string | null
  sealUrl?: string | null
}

const modePaiementLabel: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  AUTRE: "Autre",
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

const s = StyleSheet.create({
  page:         { padding: 44, fontFamily: "Helvetica", fontSize: 10, color: "#1f2937", backgroundColor: "#ffffff" },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: "#16a34a", borderBottomStyle: "solid" },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 12, maxWidth: "55%" },
  logo:         { width: 56, height: 56, objectFit: "contain" },
  title:        { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", letterSpacing: 1.5 },
  recuNum:      { fontSize: 11, color: "#16a34a", fontFamily: "Helvetica-Bold", marginTop: 4 },
  labelSmall:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bold:         { fontFamily: "Helvetica-Bold", color: "#111827" },
  normal:       { color: "#4b5563", marginTop: 2 },
  badge:        { backgroundColor: "#16a34a", borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", marginTop: 6 },
  badgeText:    { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  parties:      { flexDirection: "row", gap: 24, marginBottom: 24 },
  partyBlock:   { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: 12 },
  tableWrap:    { borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", borderRadius: 8, marginBottom: 20 },
  tableHead:    { flexDirection: "row", backgroundColor: "#f3f4f6", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" },
  tableRow:     { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderBottomStyle: "solid" },
  tableFooter:  { flexDirection: "row", backgroundColor: "#f0fdf4", paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid" },
  colDesc:      { flex: 1 },
  colAmt:       { width: 110 },
  descMain:     { fontFamily: "Helvetica-Bold", color: "#111827", fontSize: 10 },
  descSub:      { color: "#6b7280", fontSize: 9, marginTop: 3 },
  amtNormal:    { fontFamily: "Helvetica-Bold", color: "#111827", fontSize: 11, textAlign: "right" },
  amtTotal:     { fontFamily: "Helvetica-Bold", color: "#16a34a", fontSize: 14, textAlign: "right" },
  metaRow:      { flexDirection: "row", gap: 24, marginBottom: 16 },
  metaBlock:    { flex: 1 },
  notesBox:     { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a", borderStyle: "solid", borderRadius: 6, padding: 10, marginBottom: 16 },
  notesLabel:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  notesText:    { fontSize: 9, color: "#78350f" },
  sealRow:      { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 12, minHeight: 72 },
  seal:         { width: 72, height: 72, objectFit: "contain" },
  sealCaption:  { fontSize: 8, color: "#6b7280", textAlign: "center", marginTop: 4 },
  footer:       { marginTop: "auto", paddingTop: 14, borderTopWidth: 1, borderTopColor: "#e5e7eb", borderTopStyle: "solid", textAlign: "center", color: "#9ca3af", fontSize: 9 },
})

export default function ReceiptPDF({ data }: { data: ReceiptData }) {
  const devise = data.devise === "CDF" ? "FC" : "$"
  const montantFmt = `${new Intl.NumberFormat("fr-FR").format(data.montant)} ${devise}`

  return (
    <Document title={`Reçu ${data.numeroRecu}`} author={data.schoolName} subject="Reçu de paiement scolaire">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {data.logoUrl ? <Image src={data.logoUrl} style={s.logo} /> : null}
            <View>
              <Text style={s.title}>REÇU DE PAIEMENT</Text>
              <Text style={s.recuNum}>{data.numeroRecu}</Text>
              <View style={s.badge}><Text style={s.badgeText}>PAYÉ</Text></View>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.labelSmall}>Date d&apos;émission</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{fmt(data.datePaiement)}</Text>
            <Text style={[s.labelSmall, { marginTop: 10 }]}>Année scolaire</Text>
            <Text style={s.bold}>{data.anneeScolaire}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyBlock}>
            <Text style={s.labelSmall}>Établissement</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{data.schoolName}</Text>
            {data.schoolAddress ? <Text style={s.normal}>{data.schoolAddress}</Text> : null}
            {data.schoolPhone ? <Text style={s.normal}>Tél. {data.schoolPhone}</Text> : null}
            {data.schoolEmail ? <Text style={s.normal}>{data.schoolEmail}</Text> : null}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.labelSmall}>Élève</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{data.eleve.nom}</Text>
            <Text style={s.normal}>Code : {data.eleve.code}</Text>
            <Text style={s.normal}>Classe : {data.classe}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tableHead}>
            <Text style={[s.labelSmall, s.colDesc]}>Description</Text>
            <Text style={[s.labelSmall, s.colAmt, { textAlign: "right" }]}>Montant</Text>
          </View>
          <View style={s.tableRow}>
            <View style={s.colDesc}>
              <Text style={s.descMain}>{data.typeFrais}</Text>
              <Text style={s.descSub}>{data.classe} — {data.anneeScolaire}</Text>
            </View>
            <View style={s.colAmt}>
              <Text style={s.amtNormal}>{montantFmt}</Text>
            </View>
          </View>
          <View style={s.tableFooter}>
            <Text style={[s.colDesc, { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#111827" }]}>TOTAL</Text>
            <View style={s.colAmt}>
              <Text style={s.amtTotal}>{montantFmt}</Text>
            </View>
          </View>
        </View>

        {/* Meta paiement */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.labelSmall}>Mode de paiement</Text>
            <Text style={s.bold}>{modePaiementLabel[data.modePaiement] || data.modePaiement}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.labelSmall}>Référence</Text>
            <Text style={[s.bold, { fontFamily: data.reference ? "Courier" : "Helvetica" }]}>
              {data.reference || "—"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Sceau officiel */}
        {data.sealUrl && (
          <View style={s.sealRow}>
            <View style={{ alignItems: "center" }}>
              <Image src={data.sealUrl} style={s.seal} />
              <Text style={s.sealCaption}>Cachet de l&apos;établissement</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <Text>{data.schoolName} — Ce document tient lieu de reçu officiel de paiement</Text>
          <Text style={{ marginTop: 4 }}>
            Imprimé le {new Date().toLocaleDateString("fr-FR")} — Système DigiSchool
          </Text>
        </View>
      </Page>
    </Document>
  )
}
