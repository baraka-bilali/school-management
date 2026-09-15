import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type {
  PrimaryBulletinPayload,
  BulletinStudentPayload,
  BulletinBranchLine,
  BulletinSummarySlice,
} from "@/lib/grading/primary-bulletin"

/**
 * A4 portrait condensé :
 * Branches | MaxP MaxE MaxT MaxA | [par trim: P1 P2 EX T]×3 | AN
 * = 4 maxima + 13 notes → tient dans la largeur utile (~571 pt).
 */
const PAGE_W = 595.28
const MARGIN_X = 12
const CONTENT_W = PAGE_W - MARGIN_X * 2 // ~571

const BRANCH_W = 88
const MAX_W = 18
const SCORE_W = 22
const MAX_COLS = 4 // MaxP MaxE MaxT MaxA
const SCORE_COLS = 13 // 3×(2P+EX+T) + AN = 13
const TABLE_W = BRANCH_W + MAX_COLS * MAX_W + SCORE_COLS * SCORE_W // 88+72+286 = 446

const BORDER = "#111827"
const MUTED = "#4b5563"
const LIGHT = "#f3f4f6"
const HEAD = "#e5e7eb"
const FOCUS = "#e0e7ff"

const s = StyleSheet.create({
  page: {
    width: PAGE_W,
    paddingTop: 10,
    paddingBottom: 12,
    paddingLeft: MARGIN_X,
    paddingRight: MARGIN_X,
    fontFamily: "Helvetica",
    fontSize: 6,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  logo: { width: 28, height: 28, objectFit: "contain" },
  schoolBlock: { flex: 1 },
  schoolName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  slogan: { fontSize: 5.5, color: MUTED, marginTop: 1, fontStyle: "italic" },
  meta: { fontSize: 5.5, color: MUTED, marginTop: 0.5 },
  badge: {
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 6,
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
    paddingHorizontal: 4,
    marginBottom: 3,
  },
  titleMain: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 5.5, color: MUTED },

  idGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 3,
  },
  idCol: {
    flex: 1,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  idColLast: { flex: 1, padding: 3 },
  idLine: { flexDirection: "row", marginBottom: 0.5 },
  idLabel: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    width: 48,
    color: MUTED,
  },
  idValue: { fontSize: 6, flex: 1, fontFamily: "Helvetica-Bold" },
  idValuePlain: { fontSize: 6, flex: 1 },

  tableWrap: {
    width: CONTENT_W,
    alignItems: "center",
    marginBottom: 3,
  },
  table: {
    width: TABLE_W,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
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
    paddingVertical: 1,
    paddingHorizontal: 2,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  maxHeadGroup: {
    width: MAX_COLS * MAX_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
    paddingVertical: 1,
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
    width: SCORE_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  headText: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  colHead: {
    width: SCORE_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.4,
    borderRightColor: "#9ca3af",
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  colHeadMax: {
    width: MAX_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.4,
    borderRightColor: "#9ca3af",
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  colHeadLast: {
    width: SCORE_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  colHeadFocus: { backgroundColor: FOCUS },
  tiny: {
    fontSize: 4.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  domainRow: {
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  domainText: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "solid",
    minHeight: 8,
    alignItems: "center",
  },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    minHeight: 9,
    alignItems: "center",
  },
  branchCell: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  numMax: {
    width: MAX_W,
    textAlign: "center",
    fontSize: 5,
    color: MUTED,
    borderRightWidth: 0.4,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    paddingVertical: 0.5,
  },
  numScore: {
    width: SCORE_W,
    textAlign: "center",
    fontSize: 5,
    borderRightWidth: 0.4,
    borderRightColor: "#d1d5db",
    borderRightStyle: "solid",
    paddingVertical: 0.5,
  },
  numScoreLast: {
    width: SCORE_W,
    textAlign: "center",
    fontSize: 5,
    paddingVertical: 0.5,
  },
  numBold: { fontFamily: "Helvetica-Bold" },
  numFocus: { backgroundColor: FOCUS },

  summary: {
    width: TABLE_W,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 3,
  },
  summaryLabelCell: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },

  footerBlock: {
    width: CONTENT_W,
    alignItems: "center",
  },
  signRow: {
    flexDirection: "row",
    gap: 6,
    width: TABLE_W,
    marginTop: 2,
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 36,
    padding: 3,
  },
  signLabel: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 1,
  },
  signHint: { fontSize: 4.5, color: MUTED },
  sealImg: {
    width: 28,
    height: 28,
    objectFit: "contain",
    alignSelf: "center",
    marginTop: 1,
  },
  note: {
    width: TABLE_W,
    fontSize: 4.5,
    color: MUTED,
    marginTop: 2,
  },
  pageFooter: {
    position: "absolute",
    bottom: 6,
    left: MARGIN_X,
    right: MARGIN_X,
    fontSize: 4.5,
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
  return `${n.toFixed(0)}%`
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

function isFocusPeriod(data: PrimaryBulletinPayload, periodId: number) {
  return (
    data.focusEvent.kind === "PERIOD" && data.focusEvent.periodId === periodId
  )
}

function isFocusExam(data: PrimaryBulletinPayload, groupId: number) {
  return (
    data.focusEvent.kind === "EXAM" &&
    data.focusEvent.periodGroupId === groupId
  )
}

function groupDomains(lines: BulletinBranchLine[]) {
  const domains: Array<{ name: string; lines: BulletinBranchLine[] }> = []
  for (const line of lines) {
    const last = domains[domains.length - 1]
    if (last && last.name === line.domainName) last.lines.push(line)
    else domains.push({ name: line.domainName, lines: [line] })
  }
  return domains
}

function Score({
  value,
  bold,
  focus,
  last,
}: {
  value: string
  bold?: boolean
  focus?: boolean
  last?: boolean
}) {
  return (
    <Text
      style={[
        last ? s.numScoreLast : s.numScore,
        bold ? s.numBold : {},
        focus ? s.numFocus : {},
      ]}
    >
      {value || " "}
    </Text>
  )
}

function MaxCell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <Text style={[s.numMax, bold ? s.numBold : {}]}>{value || " "}</Text>
  )
}

/** Cellules : 4 maxima + notes par trimestre + annuel */
function DataCells({
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
  const cells: ReactNode[] = [
    <MaxCell key="mp" value={fmtMax(maxPeriode)} bold={bold} />,
    <MaxCell key="me" value={fmtMax(maxExamen)} bold={bold} />,
    <MaxCell key="mt" value={fmtMax(maxTrimestre)} bold={bold} />,
    <MaxCell key="ma" value={fmtMax(maxAnnuel)} bold={bold} />,
  ]

  data.trimestres.forEach((t) => {
    t.periods.forEach((p) => {
      cells.push(
        <Score
          key={`p-${p.periodId}`}
          value={fmtPts(periodScores[String(p.periodId)])}
          bold={bold}
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    if (t.hasExam) {
      cells.push(
        <Score
          key={`ex-${t.periodGroupId}`}
          value={fmtPts(examScores[String(t.periodGroupId)])}
          bold={bold}
          focus={isFocusExam(data, t.periodGroupId)}
        />
      )
    }
    cells.push(
      <Score
        key={`tr-${t.periodGroupId}`}
        value={fmtPts(trimScores[String(t.periodGroupId)])}
        bold={bold}
      />
    )
  })

  cells.push(
    <Score key="an" value={fmtPts(annualScore)} bold={bold} last />
  )
  return <>{cells}</>
}

function SummaryRow({
  label,
  data,
  student,
  highlight,
  mode,
}: {
  label: string
  data: PrimaryBulletinPayload
  student: BulletinStudentPayload
  highlight?: boolean
  mode: "maxima" | "obtained" | "pct" | "place" | "count" | "blank"
}) {
  const byKey = new Map(student.summaries.map((x) => [x.key, x]))
  const firstPeriod = data.trimestres[0]?.periods[0]
  const firstPeriodSlice = firstPeriod
    ? byKey.get(`period:${firstPeriod.periodId}`)
    : undefined
  const firstExam = data.trimestres[0]
  const firstExamSlice = firstExam?.hasExam
    ? byKey.get(`exam:${firstExam.periodGroupId}`)
    : undefined
  const firstTrimSlice = firstExam
    ? byKey.get(`trim:${firstExam.periodGroupId}`)
    : undefined
  const yearSlice = byKey.get("year")

  const renderMax = (slice: BulletinSummarySlice | undefined) => {
    if (mode === "blank" || mode === "pct" || mode === "place" || mode === "count")
      return ""
    if (mode === "maxima") return fmtMax(slice?.maxTotal)
    return ""
  }
  const renderScore = (slice: BulletinSummarySlice | undefined) => {
    if (mode === "blank") return ""
    if (mode === "maxima") return fmtPts(slice?.obtained)
    if (mode === "obtained") return fmtPts(slice?.obtained)
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "count") return String(data.studentCount)
    return ""
  }

  const cells: ReactNode[] = [
    <MaxCell key="mp" value={renderMax(firstPeriodSlice)} bold />,
    <MaxCell key="me" value={renderMax(firstExamSlice)} bold />,
    <MaxCell key="mt" value={renderMax(firstTrimSlice)} bold />,
    <MaxCell key="ma" value={renderMax(yearSlice)} bold />,
  ]

  data.trimestres.forEach((t) => {
    t.periods.forEach((p) => {
      cells.push(
        <Score
          key={`p-${p.periodId}`}
          value={renderScore(byKey.get(`period:${p.periodId}`))}
          bold
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    if (t.hasExam) {
      cells.push(
        <Score
          key={`ex-${t.periodGroupId}`}
          value={renderScore(byKey.get(`exam:${t.periodGroupId}`))}
          bold
          focus={isFocusExam(data, t.periodGroupId)}
        />
      )
    }
    cells.push(
      <Score
        key={`tr-${t.periodGroupId}`}
        value={renderScore(byKey.get(`trim:${t.periodGroupId}`))}
        bold
      />
    )
  })
  cells.push(<Score key="an" value={renderScore(yearSlice)} bold last />)

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
  const colsPerTrim = (t: (typeof data.trimestres)[0]) =>
    t.periods.length + (t.hasExam ? 1 : 0) + 1

  return (
    <Page size="A4" orientation="portrait" style={s.page}>
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
          {data.yearName} · {data.focusEvent.groupName} — {data.focusEvent.label}
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

      <View style={s.tableWrap}>
        <View style={s.table}>
          {/* Ligne 1 : groupes */}
          <View style={s.headRow}>
            <View style={s.branchHead}>
              <Text style={s.headText}>Branches</Text>
            </View>
            <View style={s.maxHeadGroup}>
              <Text style={s.headText}>Maxima</Text>
            </View>
            {data.trimestres.map((t) => (
              <View
                key={t.periodGroupId}
                style={[s.trimHead, { width: colsPerTrim(t) * SCORE_W }]}
              >
                <Text style={s.headText}>{t.shortLabel}</Text>
              </View>
            ))}
            <View style={s.yearHead}>
              <Text style={s.headText}>AN</Text>
            </View>
          </View>

          {/* Ligne 2 : sous-colonnes */}
          <View style={s.subHeadRow}>
            <View style={s.branchHead}>
              <Text style={s.tiny}> </Text>
            </View>
            <View style={[s.colHeadMax]}>
              <Text style={s.tiny}>P</Text>
            </View>
            <View style={s.colHeadMax}>
              <Text style={s.tiny}>E</Text>
            </View>
            <View style={s.colHeadMax}>
              <Text style={s.tiny}>T</Text>
            </View>
            <View
              style={[
                s.colHeadMax,
                {
                  borderRightWidth: 1,
                  borderRightColor: BORDER,
                  borderRightStyle: "solid",
                },
              ]}
            >
              <Text style={s.tiny}>A</Text>
            </View>
            {data.trimestres.map((t) => (
              <View key={t.periodGroupId} style={{ flexDirection: "row" }}>
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
                  <View
                    style={[
                      s.colHead,
                      isFocusExam(data, t.periodGroupId) ? s.colHeadFocus : {},
                    ]}
                  >
                    <Text style={s.tiny}>EX</Text>
                  </View>
                ) : null}
                <View style={s.colHead}>
                  <Text style={s.tiny}>{t.shortLabel}</Text>
                </View>
              </View>
            ))}
            <View style={s.colHeadLast}>
              <Text style={s.tiny}>Tot</Text>
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
                      <Text style={{ fontSize: 5 }}>
                        {line.name}
                        {line.groupName ? ` (${line.groupName})` : ""}
                      </Text>
                    </View>
                    <DataCells
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
                      <Text style={{ fontSize: 5, fontFamily: "Helvetica-Bold" }}>
                        Sous-total
                      </Text>
                    </View>
                    <DataCells
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
            mode="maxima"
          />
          <SummaryRow
            label="Pourcentage"
            data={data}
            student={student}
            mode="pct"
          />
          <SummaryRow
            label="Place"
            data={data}
            student={student}
            highlight
            mode="place"
          />
          <SummaryRow
            label="Nbre d'élèves"
            data={data}
            student={student}
            mode="count"
          />
          <SummaryRow
            label="Application"
            data={data}
            student={student}
            highlight
            mode="blank"
          />
          <SummaryRow
            label="Conduite"
            data={data}
            student={student}
            mode="blank"
          />
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
          Maxima : P=période · E=examen · T=trimestre · A=annuel. Les maxima
          restent visibles ; les notes se remplissent au fil des périodes et
          examens. Application / conduite à compléter si besoin.
        </Text>
      </View>

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
