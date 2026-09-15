import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type {
  PrimaryBulletinPayload,
  BulletinStudentPayload,
  BulletinBranchLine,
  BulletinVisibility,
} from "@/lib/grading/primary-bulletin"

/**
 * A4 paysage — disposition type bulletin officiel :
 * par trimestre : MAX | 1P | 2P | MX.E | EX | MX.T | Tot
 * + annuel MX.A | AN
 * Maxima toujours visibles ; points seulement si publiés.
 */
const PAGE_W = 841.89
const PAGE_H = 595.28
const MX = 10
const MY = 8
const CONTENT_W = PAGE_W - MX * 2

const BRANCH_W = 92
/** 7 cols × 3 trim + 2 annuel = 23 */
const N_SCORE_COLS = 23
const COL_W = Math.floor((CONTENT_W - BRANCH_W) / N_SCORE_COLS) // ~32
const TABLE_W = BRANCH_W + N_SCORE_COLS * COL_W

const BORDER = "#1e293b"
const MUTED = "#64748b"
const HEAD_BG = "#1e3a5f"
const HEAD_FG = "#ffffff"
const LIGHT = "#f1f5f9"
const FOCUS = "#dbeafe"
const HATCH = "#0f172a"

const s = StyleSheet.create({
  page: {
    paddingTop: MY,
    paddingBottom: MY,
    paddingLeft: MX,
    paddingRight: MX,
    fontFamily: "Helvetica",
    fontSize: 6,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  logo: { width: 26, height: 26, objectFit: "contain" },
  schoolBlock: { flex: 1 },
  schoolName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  meta: { fontSize: 5.5, color: MUTED, marginTop: 0.5 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: HEAD_BG,
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 3,
  },
  titleMain: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 5.5, color: "#cbd5e1" },

  idGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 3,
  },
  idCol: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  idColLast: { flex: 1, paddingVertical: 2, paddingHorizontal: 4 },
  idLine: { flexDirection: "row", marginBottom: 0.5 },
  idLabel: {
    width: 46,
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
  },
  idValue: { flex: 1, fontSize: 6, fontFamily: "Helvetica-Bold" },
  idPlain: { flex: 1, fontSize: 6 },

  table: {
    width: TABLE_W,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    alignSelf: "center",
  },
  headRow: {
    flexDirection: "row",
    backgroundColor: HEAD_BG,
  },
  subHeadRow: {
    flexDirection: "row",
    backgroundColor: "#334155",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  branchHead: {
    width: BRANCH_W,
    paddingVertical: 2,
    paddingHorizontal: 2,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#475569",
    borderRightStyle: "solid",
  },
  groupHead: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#475569",
    borderRightStyle: "solid",
    paddingVertical: 2,
  },
  headFg: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textAlign: "center",
    textTransform: "uppercase",
  },
  subFg: {
    fontSize: 4.5,
    fontFamily: "Helvetica-Bold",
    color: "#e2e8f0",
    textAlign: "center",
  },
  colHead: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.4,
    borderRightColor: "#64748b",
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  colHeadLast: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
  },
  colHeadFocus: { backgroundColor: "#1d4ed8" },

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
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    minHeight: 8,
    alignItems: "center",
  },
  subtotalRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    minHeight: 8,
    alignItems: "center",
  },
  branchCell: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  cell: {
    width: COL_W,
    textAlign: "center",
    fontSize: 5,
    borderRightWidth: 0.4,
    borderRightColor: "#e2e8f0",
    borderRightStyle: "solid",
    paddingVertical: 0.5,
  },
  cellLast: {
    width: COL_W,
    textAlign: "center",
    fontSize: 5,
    paddingVertical: 0.5,
  },
  cellMax: { color: MUTED, fontSize: 4.5 },
  cellBold: { fontFamily: "Helvetica-Bold", fontSize: 5 },
  cellFocus: { backgroundColor: FOCUS },
  hatch: {
    width: COL_W,
    height: 8,
    backgroundColor: HATCH,
    borderRightWidth: 0.4,
    borderRightColor: "#334155",
    borderRightStyle: "solid",
  },
  hatchLast: {
    width: COL_W,
    height: 8,
    backgroundColor: HATCH,
  },

  summaryLabel: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },

  signRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
    width: TABLE_W,
    alignSelf: "center",
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 32,
    padding: 3,
  },
  signLabel: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  signHint: { fontSize: 4.5, color: MUTED, marginTop: 1 },
  sealImg: {
    width: 26,
    height: 26,
    objectFit: "contain",
    alignSelf: "center",
    marginTop: 1,
  },
  note: {
    width: TABLE_W,
    alignSelf: "center",
    fontSize: 4.5,
    color: MUTED,
    marginTop: 2,
  },
  pageFooter: {
    position: "absolute",
    bottom: 3,
    left: MX,
    right: MX,
    fontSize: 4,
    color: "#94a3b8",
    textAlign: "center",
  },
})

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtFraction(
  obtained: number | null | undefined,
  max: number,
  visible: boolean
): string {
  const m = fmtNum(max)
  if (!visible) return m ? `/${m}` : ""
  if (obtained == null) return m ? `—/${m}` : ""
  return `${fmtNum(obtained)}/${m}`
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
  return y && m && d ? `${d}/${m}/${y}` : iso
}

function genderLabel(g: string): string {
  const v = (g || "").toUpperCase()
  if (v.startsWith("M") || v === "GARCON" || v === "GARÇON") return "M"
  if (v.startsWith("F") || v === "FILLE") return "F"
  return g || "—"
}

function isFocusPeriod(data: PrimaryBulletinPayload, periodId: number) {
  return (
    data.focusEvent.kind === "PERIOD" && data.focusEvent.periodId === periodId
  )
}

function isFocusExam(data: PrimaryBulletinPayload, gid: number) {
  return (
    data.focusEvent.kind === "EXAM" && data.focusEvent.periodGroupId === gid
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

function Cell({
  text,
  max,
  bold,
  focus,
  last,
}: {
  text: string
  max?: boolean
  bold?: boolean
  focus?: boolean
  last?: boolean
}) {
  return (
    <Text
      style={[
        last ? s.cellLast : s.cell,
        max ? s.cellMax : {},
        bold ? s.cellBold : {},
        focus ? s.cellFocus : {},
      ]}
    >
      {text || " "}
    </Text>
  )
}

function Hatch({ last }: { last?: boolean }) {
  return <View style={last ? s.hatchLast : s.hatch} />
}

/** Une ligne de notes : MAX|P1|P2|MX.E|EX|MX.T|Tot × 3 + MX.A|AN */
function ScoreCells({
  data,
  vis,
  maxPeriode,
  maxExamen,
  maxTrimestre,
  maxAnnuel,
  periodScores,
  examScores,
  trimScores,
  annualScore,
  asFraction,
  bold,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  periodScores: Record<string, number | null>
  examScores: Record<string, number | null>
  trimScores: Record<string, number | null>
  annualScore: number | null
  asFraction?: boolean
  bold?: boolean
}) {
  const cells: ReactNode[] = []
  data.trimestres.forEach((t, ti) => {
    const isLastTrim = ti === data.trimestres.length - 1
    cells.push(
      <Cell
        key={`mxp-${t.periodGroupId}`}
        text={fmtNum(maxPeriode)}
        max
        bold={bold}
      />
    )
    t.periods.forEach((p) => {
      const visible = !!vis.periods[String(p.periodId)]
      const obtained = periodScores[String(p.periodId)]
      const text = asFraction
        ? fmtFraction(obtained, maxPeriode, visible)
        : visible
          ? fmtNum(obtained)
          : ""
      cells.push(
        <Cell
          key={`p-${p.periodId}`}
          text={text}
          bold={bold}
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    cells.push(
      <Cell
        key={`mxe-${t.periodGroupId}`}
        text={fmtNum(maxExamen)}
        max
        bold={bold}
      />
    )
    {
      const visible = !!vis.exams[String(t.periodGroupId)]
      const obtained = examScores[String(t.periodGroupId)]
      const text = asFraction
        ? fmtFraction(obtained, maxExamen, visible)
        : visible
          ? fmtNum(obtained)
          : ""
      cells.push(
        <Cell
          key={`ex-${t.periodGroupId}`}
          text={text}
          bold={bold}
          focus={isFocusExam(data, t.periodGroupId)}
        />
      )
    }
    cells.push(
      <Cell
        key={`mxt-${t.periodGroupId}`}
        text={fmtNum(maxTrimestre)}
        max
        bold={bold}
      />
    )
    {
      const visible = !!vis.trims[String(t.periodGroupId)]
      const obtained = trimScores[String(t.periodGroupId)]
      const text = asFraction
        ? fmtFraction(obtained, maxTrimestre, visible)
        : visible
          ? fmtNum(obtained)
          : ""
      cells.push(
        <Cell
          key={`tr-${t.periodGroupId}`}
          text={text}
          bold={bold}
          last={false}
        />
      )
    }
    void isLastTrim
  })
  cells.push(<Cell key="mxa" text={fmtNum(maxAnnuel)} max bold={bold} />)
  {
    const text = asFraction
      ? fmtFraction(annualScore, maxAnnuel, vis.year)
      : vis.year
        ? fmtNum(annualScore)
        : ""
    cells.push(<Cell key="an" text={text} bold={bold} last />)
  }
  return <>{cells}</>
}

function SummaryScoreCells({
  data,
  vis,
  mode,
  student,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  mode: "maxima" | "pct" | "place" | "application"
  student: BulletinStudentPayload
}) {
  const byKey = new Map(student.summaries.map((x) => [x.key, x]))
  const cells: ReactNode[] = []

  const renderPeriod = (periodId: number) => {
    const slice = byKey.get(`period:${periodId}`)
    const visible = !!vis.periods[String(periodId)]
    if (mode === "maxima") {
      return visible
        ? fmtFraction(slice?.obtained ?? null, slice?.maxTotal ?? 0, true)
        : `/${fmtNum(slice?.maxTotal)}`
    }
    if (!visible) return ""
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "application") return slice?.application || ""
    return ""
  }
  const renderExam = (gid: number) => {
    const slice = byKey.get(`exam:${gid}`)
    const visible = !!vis.exams[String(gid)]
    if (mode === "maxima") {
      return visible
        ? fmtFraction(slice?.obtained ?? null, slice?.maxTotal ?? 0, true)
        : `/${fmtNum(slice?.maxTotal)}`
    }
    if (!visible) return ""
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "application") return slice?.application || ""
    return ""
  }
  const renderTrim = (gid: number) => {
    const slice = byKey.get(`trim:${gid}`)
    const visible = !!vis.trims[String(gid)]
    if (mode === "maxima") {
      return visible
        ? fmtFraction(slice?.obtained ?? null, slice?.maxTotal ?? 0, true)
        : `/${fmtNum(slice?.maxTotal)}`
    }
    if (!visible) return ""
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "application") return slice?.application || ""
    return ""
  }
  const renderYear = () => {
    const slice = byKey.get("year")
    if (mode === "maxima") {
      return vis.year
        ? fmtFraction(slice?.obtained ?? null, slice?.maxTotal ?? 0, true)
        : `/${fmtNum(slice?.maxTotal)}`
    }
    if (!vis.year) return ""
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "application") return slice?.application || ""
    return ""
  }

  data.trimestres.forEach((t) => {
    // MAX période — pour maxima généraux on répète le max période global
    const periodSlice = byKey.get(`period:${t.periods[0]?.periodId}`)
    cells.push(
      <Cell
        key={`smx-${t.periodGroupId}`}
        text={mode === "maxima" ? fmtNum(periodSlice?.maxTotal) : ""}
        max
        bold
      />
    )
    t.periods.forEach((p) => {
      cells.push(
        <Cell
          key={`sp-${p.periodId}`}
          text={renderPeriod(p.periodId)}
          bold
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    const examSlice = byKey.get(`exam:${t.periodGroupId}`)
    cells.push(
      <Cell
        key={`smxe-${t.periodGroupId}`}
        text={mode === "maxima" ? fmtNum(examSlice?.maxTotal) : ""}
        max
        bold
      />
    )
    cells.push(
      <Cell
        key={`sex-${t.periodGroupId}`}
        text={renderExam(t.periodGroupId)}
        bold
        focus={isFocusExam(data, t.periodGroupId)}
      />
    )
    const trimSlice = byKey.get(`trim:${t.periodGroupId}`)
    cells.push(
      <Cell
        key={`smxt-${t.periodGroupId}`}
        text={mode === "maxima" ? fmtNum(trimSlice?.maxTotal) : ""}
        max
        bold
      />
    )
    cells.push(
      <Cell
        key={`str-${t.periodGroupId}`}
        text={renderTrim(t.periodGroupId)}
        bold
      />
    )
  })
  const yearSlice = byKey.get("year")
  cells.push(
    <Cell
      key="smxa"
      text={mode === "maxima" ? fmtNum(yearSlice?.maxTotal) : ""}
      max
      bold
    />
  )
  cells.push(<Cell key="san" text={renderYear()} bold last />)
  return <>{cells}</>
}

/** Conduite : périodes seulement ; EX / Tot / MAX / AN hachurés. */
function ConduiteCells({
  data,
  vis,
  student,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  student: BulletinStudentPayload
}) {
  const cells: ReactNode[] = []
  data.trimestres.forEach((t) => {
    cells.push(<Hatch key={`h-mxp-${t.periodGroupId}`} />)
    t.periods.forEach((p) => {
      const visible = !!vis.periods[String(p.periodId)]
      const code = visible
        ? student.conduiteByPeriod[String(p.periodId)] || ""
        : ""
      cells.push(
        <Cell
          key={`c-${p.periodId}`}
          text={code}
          bold
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    cells.push(<Hatch key={`h-mxe-${t.periodGroupId}`} />)
    cells.push(<Hatch key={`h-ex-${t.periodGroupId}`} />)
    cells.push(<Hatch key={`h-mxt-${t.periodGroupId}`} />)
    cells.push(<Hatch key={`h-tr-${t.periodGroupId}`} />)
  })
  cells.push(<Hatch key="h-mxa" />)
  cells.push(<Hatch key="h-an" last />)
  return <>{cells}</>
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
  const vis = data.visibility
  const addressLine = [data.school.schoolAddress, data.school.schoolCity]
    .filter(Boolean)
    .join(", ")
  const colsPerTrim = 7 // MAX + 2P + MX.E + EX + MX.T + Tot

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
          <Text style={s.meta}>
            {[addressLine, data.school.schoolPhone, data.school.schoolEmail]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </View>

      <View style={s.titleRow}>
        <Text style={s.titleMain}>
          Bulletin — {data.class.name} · {student.fullName}
        </Text>
        <Text style={s.titleSub}>
          {data.yearName}
          {vis.publishedThroughLabel
            ? ` · Publié jusqu'à : ${vis.publishedThroughLabel}`
            : " · Aucune période publiée"}
        </Text>
      </View>

      <View style={s.idGrid}>
        <View style={s.idCol}>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Élève</Text>
            <Text style={s.idValue}>{student.fullName}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Sexe / Né</Text>
            <Text style={s.idPlain}>
              {genderLabel(student.gender)} · {student.birthPlace || "—"}{" "}
              {fmtDateFr(student.birthDate)}
            </Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>N° perm.</Text>
            <Text style={s.idPlain}>{student.permanentCode || "—"}</Text>
          </View>
        </View>
        <View style={s.idColLast}>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Classe</Text>
            <Text style={s.idValue}>
              {data.class.name} · N° {student.code || "—"}
            </Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Titulaire</Text>
            <Text style={s.idPlain}>{data.class.titulaireName || "—"}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Effectif</Text>
            <Text style={s.idPlain}>{data.studentCount} élèves</Text>
          </View>
        </View>
      </View>

      <View style={s.table}>
        <View style={s.headRow}>
          <View style={s.branchHead}>
            <Text style={s.headFg}>Branches</Text>
          </View>
          {data.trimestres.map((t) => (
            <View
              key={t.periodGroupId}
              style={[s.groupHead, { width: colsPerTrim * COL_W }]}
            >
              <Text style={s.headFg}>{t.name}</Text>
            </View>
          ))}
          <View style={[s.groupHead, { width: 2 * COL_W, borderRightWidth: 0 }]}>
            <Text style={s.headFg}>Année</Text>
          </View>
        </View>

        <View style={s.subHeadRow}>
          <View style={s.branchHead}>
            <Text style={s.subFg}> </Text>
          </View>
          {data.trimestres.map((t) => (
            <View key={t.periodGroupId} style={{ flexDirection: "row" }}>
              <View style={s.colHead}>
                <Text style={s.subFg}>MAX</Text>
              </View>
              {t.periods.map((p) => (
                <View
                  key={p.periodId}
                  style={[
                    s.colHead,
                    isFocusPeriod(data, p.periodId) ? s.colHeadFocus : {},
                  ]}
                >
                  <Text style={s.subFg}>{p.shortLabel}</Text>
                </View>
              ))}
              <View style={s.colHead}>
                <Text style={s.subFg}>MX.E</Text>
              </View>
              <View
                style={[
                  s.colHead,
                  isFocusExam(data, t.periodGroupId) ? s.colHeadFocus : {},
                ]}
              >
                <Text style={s.subFg}>EX</Text>
              </View>
              <View style={s.colHead}>
                <Text style={s.subFg}>MX.T</Text>
              </View>
              <View style={s.colHead}>
                <Text style={s.subFg}>{t.shortLabel}</Text>
              </View>
            </View>
          ))}
          <View style={s.colHead}>
            <Text style={s.subFg}>MX.A</Text>
          </View>
          <View style={s.colHeadLast}>
            <Text style={s.subFg}>AN</Text>
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
                  <ScoreCells
                    data={data}
                    vis={vis}
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
                  <ScoreCells
                    data={data}
                    vis={vis}
                    maxPeriode={sub.maxPeriode}
                    maxExamen={sub.maxExamen}
                    maxTrimestre={sub.maxTrimestre}
                    maxAnnuel={sub.maxAnnuel}
                    periodScores={sub.periodScores}
                    examScores={sub.examScores}
                    trimScores={sub.trimScores}
                    annualScore={sub.annualScore}
                    asFraction
                    bold
                  />
                </View>
              ) : null}
            </View>
          )
        })}

        {/* Synthèse */}
        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={s.summaryLabel}>Maxima généraux</Text>
          <SummaryScoreCells
            data={data}
            vis={vis}
            mode="maxima"
            student={student}
          />
        </View>
        <View style={s.row} wrap={false}>
          <Text style={s.summaryLabel}>Pourcentage</Text>
          <SummaryScoreCells
            data={data}
            vis={vis}
            mode="pct"
            student={student}
          />
        </View>
        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={s.summaryLabel}>Place</Text>
          <SummaryScoreCells
            data={data}
            vis={vis}
            mode="place"
            student={student}
          />
        </View>
        <View style={s.row} wrap={false}>
          <Text style={s.summaryLabel}>Application</Text>
          <SummaryScoreCells
            data={data}
            vis={vis}
            mode="application"
            student={student}
          />
        </View>
        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={s.summaryLabel}>Conduite</Text>
          <ConduiteCells data={data} vis={vis} student={student} />
        </View>
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
          ) : null}
        </View>
      </View>

      <Text style={s.note}>
        MAX / MX.E / MX.T / MX.A = maxima (toujours visibles). Points affichés
        uniquement pour les événements publiés (ordre cumulatif). Sous-totaux en
        obtenu/max. Application dérivée du %. Conduite : périodes seulement
        (cases hachurées = non applicable).
      </Text>

      <Text
        style={s.pageFooter}
        render={() =>
          `${data.school.schoolName} · ${pageIndex + 1}/${pageCount}`
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
          pageCount={data.students.length}
        />
      ))}
    </Document>
  )
}
