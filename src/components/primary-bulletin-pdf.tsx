import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type {
  PrimaryBulletinPayload,
  BulletinStudentPayload,
  BulletinBranchLine,
  BulletinTrimestreCol,
  BulletinSummarySlice,
} from "@/lib/grading/primary-bulletin"

const BORDER = "#111827"
const MUTED = "#4b5563"
const LIGHT = "#f3f4f6"
const HEAD = "#e5e7eb"
const FOCUS = "#e0e7ff"

/** Largeur fixe des colonnes numériques (paysage A4). */
const COL_W = 24
const BRANCH_W = 100

const s = StyleSheet.create({
  page: {
    paddingTop: 12,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 22,
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 1.2,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  logo: { width: 36, height: 36, objectFit: "contain" },
  schoolBlock: { flex: 1 },
  schoolName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  slogan: { fontSize: 6.5, color: MUTED, marginTop: 1, fontStyle: "italic" },
  meta: { fontSize: 6, color: MUTED, marginTop: 1 },
  badge: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginBottom: 4,
  },
  titleMain: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 6.5, color: MUTED },

  idGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 4,
  },
  idCol: {
    flex: 1,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  idColLast: { flex: 1, padding: 3 },
  idLine: { flexDirection: "row", marginBottom: 1 },
  idLabel: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    width: 52,
    color: MUTED,
  },
  idValue: { fontSize: 6.5, flex: 1, fontFamily: "Helvetica-Bold" },
  idValuePlain: { fontSize: 6.5, flex: 1 },

  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 3,
  },
  headRow: {
    flexDirection: "row",
    backgroundColor: HEAD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  subHeadRow: {
    flexDirection: "row",
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  branchHead: {
    width: BRANCH_W,
    paddingVertical: 2,
    paddingHorizontal: 3,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  trimHead: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  yearHead: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  headText: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  colHead: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#9ca3af",
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  colHeadLast: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  colHeadFocus: {
    backgroundColor: FOCUS,
  },
  tiny: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  domainRow: {
    flexDirection: "row",
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 1,
    paddingHorizontal: 3,
  },
  domainText: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    minHeight: 9,
    alignItems: "center",
  },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    minHeight: 10,
    alignItems: "center",
  },
  branchCell: {
    width: BRANCH_W,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  numCell: {
    width: COL_W,
    textAlign: "center",
    fontSize: 5.5,
    borderRightWidth: 0.4,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    paddingVertical: 0.5,
  },
  numCellLast: {
    width: COL_W,
    textAlign: "center",
    fontSize: 5.5,
    paddingVertical: 0.5,
  },
  numBold: { fontFamily: "Helvetica-Bold", fontSize: 5.5 },
  numMuted: { color: MUTED, fontSize: 5.5 },
  numFocus: { backgroundColor: FOCUS },

  summary: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 3,
  },
  summaryLabelCell: {
    width: BRANCH_W,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  signRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 42,
    padding: 3,
  },
  signLabel: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  signHint: { fontSize: 5, color: MUTED },
  sealImg: {
    width: 34,
    height: 34,
    objectFit: "contain",
    alignSelf: "center",
    marginTop: 2,
  },
  note: { fontSize: 5, color: MUTED, marginTop: 2 },
  pageFooter: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    fontSize: 5,
    color: "#9ca3af",
    textAlign: "center",
  },
})

function fmtPts(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtMax(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(0)
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ""
  return `${n.toFixed(1)}%`
}

function fmtPlace(place: number | null, count: number): string {
  if (place == null || count <= 0) return ""
  return `${place}/${count}`
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

function colsPerTrimestre(t: BulletinTrimestreCol): number {
  // MAX + periods + (MAX EX + EX if exam) + MAX TRIM + TRIM
  return 1 + t.periods.length + (t.hasExam ? 2 : 0) + 2
}

function yearCols(): number {
  return 2 // MAX + PTS
}

function isFocusPeriod(
  data: PrimaryBulletinPayload,
  periodId: number
): boolean {
  return (
    data.focusEvent.kind === "PERIOD" &&
    data.focusEvent.periodId === periodId
  )
}

function isFocusExam(
  data: PrimaryBulletinPayload,
  groupId: number
): boolean {
  return (
    data.focusEvent.kind === "EXAM" &&
    data.focusEvent.periodGroupId === groupId
  )
}

type DomainBlock = { name: string; lines: BulletinBranchLine[] }

function groupDomains(lines: BulletinBranchLine[]): DomainBlock[] {
  const domains: DomainBlock[] = []
  for (const line of lines) {
    const last = domains[domains.length - 1]
    if (last && last.name === line.domainName) last.lines.push(line)
    else domains.push({ name: line.domainName, lines: [line] })
  }
  return domains
}

function Num({
  value,
  bold,
  muted,
  focus,
  last,
}: {
  value: string
  bold?: boolean
  muted?: boolean
  focus?: boolean
  last?: boolean
}) {
  return (
    <Text
      style={[
        last ? s.numCellLast : s.numCell,
        bold ? s.numBold : {},
        muted ? s.numMuted : {},
        focus ? s.numFocus : {},
      ]}
    >
      {value || " "}
    </Text>
  )
}

function BranchScoreCells({
  data,
  maxPeriode,
  maxExamen,
  maxTrimestre,
  maxAnnuel,
  periodScores,
  examScores,
  trimScores,
  annualScore,
  bold,
}: {
  data: PrimaryBulletinPayload
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  trimScores: Record<string, number | null>
  annualScore: number | null
  bold?: boolean
}) {
  const cells: ReactNode[] = []
  data.trimestres.forEach((t, ti) => {
    const isLastTrim = ti === data.trimestres.length - 1
    cells.push(
      <Num
        key={`maxp-${t.periodGroupId}`}
        value={fmtMax(maxPeriode)}
        muted
        bold={bold}
      />
    )
    t.periods.forEach((p) => {
      cells.push(
        <Num
          key={`p-${p.periodId}`}
          value={fmtPts(periodScores[String(p.periodId)])}
          bold={bold}
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    if (t.hasExam) {
      cells.push(
        <Num
          key={`maxe-${t.periodGroupId}`}
          value={fmtMax(maxExamen)}
          muted
          bold={bold}
        />
      )
      cells.push(
        <Num
          key={`ex-${t.periodGroupId}`}
          value={fmtPts(examScores[String(t.periodGroupId)])}
          bold={bold}
          focus={isFocusExam(data, t.periodGroupId)}
        />
      )
    }
    cells.push(
      <Num
        key={`maxt-${t.periodGroupId}`}
        value={fmtMax(maxTrimestre)}
        muted
        bold={bold}
      />
    )
    cells.push(
      <Num
        key={`tr-${t.periodGroupId}`}
        value={fmtPts(trimScores[String(t.periodGroupId)])}
        bold={bold}
        last={isLastTrim ? false : false}
      />
    )
  })
  cells.push(
    <Num key="maxy" value={fmtMax(maxAnnuel)} muted bold={bold} />
  )
  cells.push(
    <Num key="y" value={fmtPts(annualScore)} bold={bold} last />
  )
  return <>{cells}</>
}

function SummaryRow({
  label,
  data,
  student,
  highlight,
  render,
}: {
  label: string
  data: PrimaryBulletinPayload
  student: BulletinStudentPayload
  highlight?: boolean
  render: (slice: BulletinSummarySlice | undefined, kind: "max" | "pts") => string
}) {
  const byKey = new Map(student.summaries.map((x) => [x.key, x]))
  const cells: ReactNode[] = []

  data.trimestres.forEach((t) => {
    // MAX période (blank in summary for max row we show maxTotal on pts cols differently)
    // For maxima généraux: show max on MAX cols and obtained on score cols
    cells.push(
      <Num
        key={`sm-maxp-${t.periodGroupId}`}
        value={render(byKey.get(`period:${t.periods[0]?.periodId}`), "max")}
        muted
        bold
      />
    )
    t.periods.forEach((p) => {
      cells.push(
        <Num
          key={`sm-p-${p.periodId}`}
          value={render(byKey.get(`period:${p.periodId}`), "pts")}
          bold
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    if (t.hasExam) {
      cells.push(
        <Num
          key={`sm-maxe-${t.periodGroupId}`}
          value={render(byKey.get(`exam:${t.periodGroupId}`), "max")}
          muted
          bold
        />
      )
      cells.push(
        <Num
          key={`sm-ex-${t.periodGroupId}`}
          value={render(byKey.get(`exam:${t.periodGroupId}`), "pts")}
          bold
          focus={isFocusExam(data, t.periodGroupId)}
        />
      )
    }
    cells.push(
      <Num
        key={`sm-maxt-${t.periodGroupId}`}
        value={render(byKey.get(`trim:${t.periodGroupId}`), "max")}
        muted
        bold
      />
    )
    cells.push(
      <Num
        key={`sm-tr-${t.periodGroupId}`}
        value={render(byKey.get(`trim:${t.periodGroupId}`), "pts")}
        bold
      />
    )
  })
  cells.push(
    <Num
      key="sm-maxy"
      value={render(byKey.get("year"), "max")}
      muted
      bold
    />
  )
  cells.push(
    <Num
      key="sm-y"
      value={render(byKey.get("year"), "pts")}
      bold
      last
    />
  )

  return (
    <View
      style={[s.row, highlight ? { backgroundColor: LIGHT } : {}]}
      wrap={false}
    >
      <Text style={s.summaryLabelCell}>{label}</Text>
      {cells}
    </View>
  )
}

function EmptySummaryRow({
  label,
  data,
  highlight,
}: {
  label: string
  data: PrimaryBulletinPayload
  highlight?: boolean
}) {
  const totalCols =
    data.trimestres.reduce((n, t) => n + colsPerTrimestre(t), 0) + yearCols()
  const cells = Array.from({ length: totalCols }, (_, i) => (
    <Num key={i} value=" " last={i === totalCols - 1} />
  ))
  return (
    <View
      style={[s.row, highlight ? { backgroundColor: LIGHT } : {}]}
      wrap={false}
    >
      <Text style={s.summaryLabelCell}>{label}</Text>
      {cells}
    </View>
  )
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
    <Page size="A4" orientation="landscape" style={s.page}>
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
        <View style={s.badge}>
          <Text style={s.badgeText}>Bulletin</Text>
        </View>
      </View>

      <View style={s.titleBar}>
        <Text style={s.titleMain}>
          Bulletin de l&apos;élève — {data.class.level}
          {data.class.letter ? ` ${data.class.letter}` : ""}
        </Text>
        <Text style={s.titleSub}>
          Année {data.yearName} · Focus : {data.focusEvent.groupName} —{" "}
          {data.focusEvent.label}
        </Text>
      </View>

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
            <Text style={s.idValuePlain}>{data.studentCount} élèves</Text>
          </View>
        </View>
      </View>

      <View style={s.table}>
        {/* Ligne 1 : trimestres */}
        <View style={s.headRow}>
          <View style={s.branchHead}>
            <Text style={s.headText}>Branches</Text>
          </View>
          {data.trimestres.map((t) => (
            <View
              key={t.periodGroupId}
              style={[s.trimHead, { width: colsPerTrimestre(t) * COL_W }]}
            >
              <Text style={s.headText}>{t.name}</Text>
            </View>
          ))}
          <View style={[s.yearHead, { width: yearCols() * COL_W }]}>
            <Text style={s.headText}>Total</Text>
          </View>
        </View>

        {/* Ligne 2 : sous-colonnes */}
        <View style={s.subHeadRow}>
          <View style={s.branchHead}>
            <Text style={s.tiny}> </Text>
          </View>
          {data.trimestres.map((t, ti) => (
            <View key={t.periodGroupId} style={{ flexDirection: "row" }}>
              <View style={s.colHead}>
                <Text style={s.tiny}>MAX</Text>
              </View>
              {t.periods.map((p) => (
                <View
                  key={p.periodId}
                  style={[
                    s.colHead,
                    isFocusPeriod(data, p.periodId) ? s.colHeadFocus : {},
                  ]}
                >
                  <Text style={s.tiny}>{p.shortLabel}</Text>
                </View>
              ))}
              {t.hasExam ? (
                <>
                  <View style={s.colHead}>
                    <Text style={s.tiny}>MX.E</Text>
                  </View>
                  <View
                    style={[
                      s.colHead,
                      isFocusExam(data, t.periodGroupId) ? s.colHeadFocus : {},
                    ]}
                  >
                    <Text style={s.tiny}>EX</Text>
                  </View>
                </>
              ) : null}
              <View style={s.colHead}>
                <Text style={s.tiny}>MX.T</Text>
              </View>
              <View
                style={
                  ti === data.trimestres.length - 1 && yearCols() === 0
                    ? s.colHeadLast
                    : s.colHead
                }
              >
                <Text style={s.tiny}>{t.shortLabel}</Text>
              </View>
            </View>
          ))}
          <View style={s.colHead}>
            <Text style={s.tiny}>MX.A</Text>
          </View>
          <View style={s.colHeadLast}>
            <Text style={s.tiny}>AN</Text>
          </View>
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
              {domain.lines.map((line) => (
                <View key={line.subjectId} style={s.row} wrap={false}>
                  <View style={s.branchCell}>
                    <Text style={{ fontSize: 5.5 }}>
                      {line.name}
                      {line.groupName ? ` (${line.groupName})` : ""}
                    </Text>
                  </View>
                  <BranchScoreCells
                    data={data}
                    maxPeriode={line.maxPeriode}
                    maxExamen={line.maxExamen}
                    maxTrimestre={line.maxTrimestre}
                    maxAnnuel={line.maxAnnuel}
                    periodScores={line.periodScores}
                    examScores={line.examScores}
                    trimScores={line.trimScores}
                    annualScore={line.annualScore}
                  />
                </View>
              ))}
              {sub ? (
                <View style={s.subtotalRow} wrap={false}>
                  <View style={s.branchCell}>
                    <Text style={[s.numBold, { textAlign: "left" }]}>
                      Sous-total
                    </Text>
                  </View>
                  <BranchScoreCells
                    data={data}
                    maxPeriode={sub.maxPeriode}
                    maxExamen={sub.maxExamen}
                    maxTrimestre={sub.maxTrimestre}
                    maxAnnuel={sub.maxAnnuel}
                    periodScores={sub.periodScores}
                    examScores={sub.examScores}
                    trimScores={sub.trimScores}
                    annualScore={sub.annualScore}
                    bold
                  />
                </View>
              ) : null}
            </View>
          )
        })}
      </View>

      <View style={s.summary}>
        <SummaryRow
          label="Maxima généraux"
          data={data}
          student={student}
          highlight
          render={(slice, kind) =>
            kind === "max" ? fmtMax(slice?.maxTotal) : fmtPts(slice?.obtained)
          }
        />
        <SummaryRow
          label="Pourcentage"
          data={data}
          student={student}
          render={(slice, kind) =>
            kind === "max" ? "" : fmtPct(slice?.percentage)
          }
        />
        <SummaryRow
          label="Place"
          data={data}
          student={student}
          highlight
          render={(slice, kind) =>
            kind === "max" ? "" : fmtPlace(slice?.place ?? null, data.studentCount)
          }
        />
        <SummaryRow
          label="Nombre d'élèves"
          data={data}
          student={student}
          render={(_slice, kind) =>
            kind === "max" ? "" : String(data.studentCount)
          }
        />
        <EmptySummaryRow label="Application" data={data} highlight />
        <EmptySummaryRow label="Conduite" data={data} />
      </View>

      <View style={s.signRow}>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Signature de l&apos;instituteur</Text>
          <Text style={s.signHint}>
            {data.class.titulaireName || "Titulaire"}
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
        MAX = maximum période · MX.E = max examen · MX.T = max trimestre · MX.A =
        max annuel. Les maxima restent visibles même si seules certaines périodes
        ont des notes — le bulletin se remplit au fil de l&apos;année.
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
      title={`Bulletins ${data.class.name} — ${data.yearName}`}
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
