import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type {
  PrimaryBulletinPayload,
  BulletinStudentPayload,
  BulletinBranchLine,
} from "@/lib/grading/primary-bulletin"

const BORDER = "#111827"
const MUTED = "#4b5563"
const LIGHT = "#f3f4f6"
const HEAD = "#e5e7eb"

const s = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 22,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  // —— En-tête école uniquement (pas de symboles nationaux) ——
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
    paddingBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  logo: { width: 42, height: 42, objectFit: "contain" },
  schoolBlock: { flex: 1 },
  schoolName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  slogan: { fontSize: 7, color: MUTED, marginTop: 1, fontStyle: "italic" },
  meta: { fontSize: 7, color: MUTED, marginTop: 1 },
  badgeWrap: { alignItems: "flex-end" },
  badge: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // —— Bandeau titre ——
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 5,
  },
  titleMain: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 7, color: MUTED },

  // —— Identité élève / classe ——
  idGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 5,
  },
  idCol: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  idColLast: { flex: 1, padding: 4 },
  idLine: { flexDirection: "row", marginBottom: 1 },
  idLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    width: 64,
    color: MUTED,
  },
  idValue: { fontSize: 7.5, flex: 1, fontFamily: "Helvetica-Bold" },
  idValuePlain: { fontSize: 7.5, flex: 1 },

  // —— Table notes ——
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 5,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: HEAD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  th: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  domainRow: {
    backgroundColor: LIGHT,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  domainText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  groupHint: {
    fontSize: 6,
    color: MUTED,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    minHeight: 11,
    alignItems: "center",
  },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    minHeight: 12,
    alignItems: "center",
  },
  colBranch: { flex: 1, paddingVertical: 1, paddingHorizontal: 5 },
  colMax: {
    width: 42,
    textAlign: "center",
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    borderLeftStyle: "solid",
    paddingVertical: 1,
  },
  colPts: {
    width: 48,
    textAlign: "center",
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    borderLeftStyle: "solid",
    paddingVertical: 1,
  },
  colPct: {
    width: 40,
    textAlign: "center",
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    borderLeftStyle: "solid",
    paddingVertical: 1,
  },
  cell: { fontSize: 7 },
  cellBold: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  cellMuted: { fontSize: 7, color: MUTED },

  // —— Synthèse (maxima généraux, place, conduite…) ——
  summary: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 5,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    minHeight: 13,
    alignItems: "center",
  },
  summaryRowLast: {
    flexDirection: "row",
    minHeight: 13,
    alignItems: "center",
  },
  summaryLabel: {
    flex: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  summaryValue: {
    width: 130,
    textAlign: "center",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    borderLeftStyle: "solid",
    paddingVertical: 2,
  },
  summaryValuePlain: {
    width: 130,
    textAlign: "center",
    fontSize: 7.5,
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    borderLeftStyle: "solid",
    paddingVertical: 2,
    minHeight: 13,
  },
  summaryHighlight: { backgroundColor: LIGHT },

  // —— Signatures ——
  signRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    marginBottom: 3,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 48,
    padding: 4,
  },
  signLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  signHint: { fontSize: 6, color: MUTED },
  sealImg: { width: 40, height: 40, objectFit: "contain", alignSelf: "center" },

  note: {
    fontSize: 6,
    color: MUTED,
    marginTop: 1,
  },
  pageFooter: {
    position: "absolute",
    bottom: 10,
    left: 22,
    right: 22,
    fontSize: 6,
    color: "#9ca3af",
    textAlign: "center",
  },
})

function fmtPts(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return `${n.toFixed(1)} %`
}

function fmtPlace(place: number | null, count: number): string {
  if (place == null || count <= 0) return "—"
  return `${place}e / ${count}`
}

function fmtDateFr(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function genderLabel(g: string): string {
  const v = (g || "").toUpperCase()
  if (v === "M" || v === "MASCULIN" || v === "GARCON" || v === "GARÇON") return "M"
  if (v === "F" || v === "FEMININ" || v === "FÉMININ" || v === "FILLE") return "F"
  return g || "—"
}

type DomainBlock = {
  name: string
  lines: BulletinBranchLine[]
}

function groupDomains(lines: BulletinBranchLine[]): DomainBlock[] {
  const domains: DomainBlock[] = []
  for (const line of lines) {
    const last = domains[domains.length - 1]
    if (last && last.name === line.domainName) last.lines.push(line)
    else domains.push({ name: line.domainName, lines: [line] })
  }
  return domains
}

function BulletinPage({
  data,
  student,
  pageIndex,
  pageCount,
}: {
  data: PrimaryBulletinPayload
  student: BulletinStudentPayload
  pageIndex: number
  pageCount: number
}) {
  const domains = groupDomains(student.lines)
  const addressLine = [data.school.schoolAddress, data.school.schoolCity]
    .filter(Boolean)
    .join(", ")

  return (
    <Page size="A4" style={s.page}>
      {/* En-tête école */}
      <View style={s.header}>
        {data.school.logoUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
          <Image src={data.school.logoUrl} style={s.logo} />
        ) : null}
        <View style={s.schoolBlock}>
          <Text style={s.schoolName}>
            {data.school.schoolName || "Établissement"}
          </Text>
          {data.school.slogan ? (
            <Text style={s.slogan}>{data.school.slogan}</Text>
          ) : null}
          {addressLine ? <Text style={s.meta}>{addressLine}</Text> : null}
          {(data.school.schoolPhone || data.school.schoolEmail) && (
            <Text style={s.meta}>
              {[data.school.schoolPhone, data.school.schoolEmail]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          )}
        </View>
        <View style={s.badgeWrap}>
          <View style={s.badge}>
            <Text style={s.badgeText}>Bulletin</Text>
          </View>
        </View>
      </View>

      <View style={s.titleBar}>
        <Text style={s.titleMain}>
          Bulletin de l&apos;élève — {data.class.level}
          {data.class.letter ? ` ${data.class.letter}` : ""}
        </Text>
        <Text style={s.titleSub}>
          {data.event.groupName} · {data.event.label} · {data.yearName}
        </Text>
      </View>

      {/* Identité */}
      <View style={s.idGrid}>
        <View style={s.idCol}>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Élève</Text>
            <Text style={s.idValue}>{student.fullName}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Sexe</Text>
            <Text style={s.idValuePlain}>{genderLabel(student.gender)}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Né(e) à</Text>
            <Text style={s.idValuePlain}>
              {student.birthPlace || "—"} · {fmtDateFr(student.birthDate)}
            </Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>N° perm.</Text>
            <Text style={s.idValuePlain}>{student.permanentCode || "—"}</Text>
          </View>
        </View>
        <View style={s.idColLast}>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Classe</Text>
            <Text style={s.idValue}>{data.class.name}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>N° classe</Text>
            <Text style={s.idValuePlain}>{student.code || "—"}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Titulaire</Text>
            <Text style={s.idValuePlain}>
              {data.class.titulaireName || "—"}
            </Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Effectif</Text>
            <Text style={s.idValuePlain}>
              {data.studentCount} élève{data.studentCount > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Tableau branches — maxima toujours visibles */}
      <View style={s.table}>
        <View style={s.tableHead}>
          <Text style={[s.colBranch, s.th, { textAlign: "left" }]}>Branches</Text>
          <Text style={[s.colMax, s.th]}>Max</Text>
          <Text style={[s.colPts, s.th]}>Pts obt.</Text>
          <Text style={[s.colPct, s.th]}>%</Text>
        </View>

        {domains.map((domain) => {
          const sub = student.domainSubtotals.find(
            (d) => d.domainName === domain.name
          )
          return (
            <View key={domain.name}>
              <View style={s.domainRow}>
                <Text style={s.domainText}>{domain.name}</Text>
              </View>
              {domain.lines.map((line) => {
                const pct =
                  line.obtained != null && line.maxPoints > 0
                    ? (line.obtained / line.maxPoints) * 100
                    : null
                return (
                  <View key={line.subjectId} style={s.row} wrap={false}>
                    <View style={s.colBranch}>
                      <Text style={s.cell}>
                        {line.name}
                        {line.groupName ? (
                          <Text style={s.groupHint}> · {line.groupName}</Text>
                        ) : null}
                      </Text>
                    </View>
                    <Text style={[s.colMax, s.cellMuted]}>
                      {fmtPts(line.maxPoints)}
                    </Text>
                    <Text style={[s.colPts, s.cell]}>
                      {fmtPts(line.obtained)}
                    </Text>
                    <Text style={[s.colPct, s.cellMuted]}>{fmtPct(pct)}</Text>
                  </View>
                )
              })}
              <View style={s.subtotalRow} wrap={false}>
                <Text style={[s.colBranch, s.cellBold]}>Sous-total</Text>
                <Text style={[s.colMax, s.cellBold]}>
                  {fmtPts(sub?.maxPoints)}
                </Text>
                <Text style={[s.colPts, s.cellBold]}>
                  {sub?.hasScore ? fmtPts(sub.obtained) : "—"}
                </Text>
                <Text style={[s.colPct, s.cellBold]}>
                  {fmtPct(sub?.percentage)}
                </Text>
              </View>
            </View>
          )
        })}
      </View>

      {/* Synthèse officielle : maxima généraux, %, place, conduite… */}
      <View style={s.summary}>
        <View style={[s.summaryRow, s.summaryHighlight]}>
          <Text style={s.summaryLabel}>Maxima généraux</Text>
          <Text style={s.summaryValue}>
            {student.percentage != null
              ? `${fmtPts(student.totalObtained)} / ${fmtPts(student.totalMax)}`
              : `— / ${fmtPts(student.totalMax)}`}
          </Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Pourcentage</Text>
          <Text style={s.summaryValue}>{fmtPct(student.percentage)}</Text>
        </View>
        <View style={[s.summaryRow, s.summaryHighlight]}>
          <Text style={s.summaryLabel}>Place</Text>
          <Text style={s.summaryValue}>
            {fmtPlace(student.place, data.studentCount)}
          </Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Nombre d&apos;élèves</Text>
          <Text style={s.summaryValue}>{data.studentCount}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Application</Text>
          <Text style={s.summaryValuePlain}>
            {student.application || " "}
          </Text>
        </View>
        <View style={s.summaryRowLast}>
          <Text style={s.summaryLabel}>Conduite</Text>
          <Text style={s.summaryValuePlain}>{student.conduite || " "}</Text>
        </View>
      </View>

      {/* Signatures */}
      <View style={s.signRow}>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Signature de l&apos;instituteur</Text>
          <Text style={s.signHint}>
            {data.class.titulaireName
              ? data.class.titulaireName
              : "Titulaire de classe"}
          </Text>
        </View>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Signature du responsable</Text>
          <Text style={s.signHint}>Parent / tuteur</Text>
        </View>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Sceau de l&apos;école</Text>
          {data.school.sealUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={data.school.sealUrl} style={s.sealImg} />
          ) : (
            <Text style={s.signHint}> </Text>
          )}
        </View>
      </View>

      <Text style={s.note}>
        Les maxima de chaque branche sont indiqués même si certaines notes ne
        sont pas encore saisies. Application et conduite à compléter
        manuellement si besoin.
      </Text>

      <Text
        style={s.pageFooter}
        render={() =>
          `${data.school.schoolName} · Kelasi 360 · ${pageIndex + 1}/${pageCount}`
        }
        fixed
      />
    </Page>
  )
}

export default function PrimaryBulletinPDF({
  data,
}: {
  data: PrimaryBulletinPayload
}) {
  const count = data.students.length
  return (
    <Document
      title={`Bulletins ${data.class.name} — ${data.event.label}`}
      author={data.school.schoolName}
      subject="Bulletins scolaires primaire"
    >
      {data.students.map((student, i) => (
        <BulletinPage
          key={student.enrollmentId}
          data={data}
          student={student}
          pageIndex={i}
          pageCount={count}
        />
      ))}
    </Document>
  )
}
