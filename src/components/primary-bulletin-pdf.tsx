import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type {
  PrimaryBulletinPayload,
  BulletinStudentPayload,
  BulletinBranchLine,
  BulletinDomainSubtotal,
  BulletinVisibility,
} from "@/lib/grading/primary-bulletin"

/**
 * A4 portrait — croquis utilisateur :
 * Branches | T1: 1P 2P Exam Tot | T2: … | T3: … | Année
 * Maxima = ligne dans la colonne Branches, reprise après chaque domaine.
 * Conduite hachurée sur Exam + Total (×3) + Année.
 */
const PAGE_W = 595.28
const MX = 14
const MY = 12
const CONTENT_W = PAGE_W - MX * 2

const BRANCH_W = 118
/** 4×3 trimestres + 1 annuel = 13 */
const N_COLS = 13
const COL_W = Math.floor((CONTENT_W - BRANCH_W) / N_COLS)
const TABLE_W = BRANCH_W + N_COLS * COL_W

const BORDER = "#1e293b"
const MUTED = "#64748b"
const HEAD_BG = "#1e3a5f"
const HEAD_FG = "#ffffff"
const LIGHT = "#eef2ff"
const ZEBRA = "#f8fafc"
const FOCUS = "#dbeafe"
const HATCH = "#0f172a"
const BELOW_AVG = "#b91c1c"

const s = StyleSheet.create({
  page: {
    paddingTop: MY,
    paddingBottom: MY + 8,
    paddingLeft: MX,
    paddingRight: MX,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logo: { width: 32, height: 32, objectFit: "contain" },
  schoolBlock: { flex: 1 },
  schoolName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  meta: { fontSize: 6.5, color: MUTED, marginTop: 1 },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: HEAD_BG,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  titleMain: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 6.5, color: "#cbd5e1" },

  idGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    marginBottom: 4,
  },
  idCol: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  idColLast: { flex: 1, paddingVertical: 3, paddingHorizontal: 5 },
  idLine: { flexDirection: "row", marginBottom: 1 },
  idLabel: {
    width: 52,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
  },
  idValue: { flex: 1, fontSize: 7, fontFamily: "Helvetica-Bold" },
  idPlain: { flex: 1, fontSize: 7 },

  table: {
    width: TABLE_W,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
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
    paddingVertical: 3,
    paddingHorizontal: 3,
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
    paddingVertical: 3,
  },
  headFg: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textAlign: "center",
    textTransform: "uppercase",
  },
  subFg: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: "#e2e8f0",
    textAlign: "center",
  },
  colHead: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#64748b",
    borderRightStyle: "solid",
    paddingVertical: 2,
  },
  colHeadLast: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  colHeadFocus: { backgroundColor: "#1d4ed8" },

  domainRow: {
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 2,
    paddingHorizontal: 3,
  },
  domainText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  groupRow: {
    backgroundColor: "#e2e8f0",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 1.5,
    paddingHorizontal: 3,
  },
  groupText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#334155",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    minHeight: 11,
    alignItems: "center",
  },
  rowZebra: { backgroundColor: ZEBRA },
  branchCell: {
    width: BRANCH_W,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  cell: {
    width: COL_W,
    textAlign: "center",
    fontSize: 6.5,
    borderRightWidth: 0.5,
    borderRightColor: "#e2e8f0",
    borderRightStyle: "solid",
    paddingVertical: 1,
  },
  cellLast: {
    width: COL_W,
    textAlign: "center",
    fontSize: 6.5,
    paddingVertical: 1,
  },
  cellBold: { fontFamily: "Helvetica-Bold", fontSize: 6.5 },
  cellMuted: { color: MUTED, fontSize: 6 },
  cellFocus: { backgroundColor: FOCUS },
  cellBelow: { color: BELOW_AVG, fontFamily: "Helvetica-Bold" },
  hatch: {
    width: COL_W,
    alignSelf: "stretch",
    minHeight: 11,
    backgroundColor: HATCH,
    borderRightWidth: 0.5,
    borderRightColor: "#334155",
    borderRightStyle: "solid",
  },
  hatchLast: {
    width: COL_W,
    alignSelf: "stretch",
    minHeight: 11,
    backgroundColor: HATCH,
  },

  summaryLabel: {
    width: BRANCH_W,
    paddingHorizontal: 3,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },

  signRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    width: TABLE_W,
    alignSelf: "center",
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 42,
    padding: 4,
  },
  signLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  signHint: { fontSize: 5.5, color: MUTED, marginTop: 2 },
  sealImg: {
    width: 32,
    height: 32,
    objectFit: "contain",
    alignSelf: "center",
    marginTop: 2,
  },
  note: {
    width: TABLE_W,
    alignSelf: "center",
    fontSize: 5.5,
    color: MUTED,
    marginTop: 4,
  },
  pageFooter: {
    position: "absolute",
    bottom: 6,
    left: MX,
    right: MX,
    fontSize: 5,
    color: "#94a3b8",
    textAlign: "center",
  },
})

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function isBelowAverage(
  obtained: number | null | undefined,
  max: number
): boolean {
  if (obtained == null || !Number.isFinite(obtained) || !(max > 0)) return false
  return obtained < max / 2
}

function fmtScore(
  obtained: number | null | undefined,
  max: number,
  visible: boolean
): { text: string; below: boolean } {
  if (!visible) return { text: "", below: false }
  if (obtained == null) return { text: "", below: false }
  const below = isBelowAverage(obtained, max)
  const base = fmtNum(obtained)
  return { text: below ? `${base}*` : base, below }
}

function fmtFraction(
  obtained: number | null | undefined,
  max: number,
  visible: boolean
): { text: string; below: boolean } {
  const m = fmtNum(max)
  if (!m) return { text: "", below: false }
  if (!visible) return { text: `/${m}`, below: false }
  if (obtained == null) return { text: `—/${m}`, below: false }
  const below = isBelowAverage(obtained, max)
  const base = `${fmtNum(obtained)}/${m}`
  return { text: below ? `${base}*` : base, below }
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

/** Sous-domaines (groupes) dans l'ordre du catalogue, puis branches sans groupe. */
function groupDomainSections(lines: BulletinBranchLine[]) {
  const sections: Array<{
    groupName: string | null
    lines: BulletinBranchLine[]
  }> = []
  for (const line of lines) {
    const key = line.groupName
    const last = sections[sections.length - 1]
    if (last && last.groupName === key) last.lines.push(line)
    else sections.push({ groupName: key, lines: [line] })
  }
  return sections
}

function sumLinesMaxima(lines: BulletinBranchLine[]) {
  return {
    maxPeriode: lines.reduce((s, l) => s + l.maxPeriode, 0),
    maxExamen: lines.reduce((s, l) => s + l.maxExamen, 0),
    maxTrimestre: lines.reduce((s, l) => s + l.maxTrimestre, 0),
    maxAnnuel: lines.reduce((s, l) => s + l.maxAnnuel, 0),
  }
}

function sumLinesScores(lines: BulletinBranchLine[]) {
  const periodScores: Record<string, number | null> = {}
  const examScores: Record<string, number | null> = {}
  const trimScores: Record<string, number | null> = {}
  let annualScore: number | null = null

  for (const line of lines) {
    for (const [k, v] of Object.entries(line.periodScores)) {
      if (v == null) continue
      periodScores[k] = (periodScores[k] ?? 0) + v
    }
    for (const [k, v] of Object.entries(line.examScores)) {
      if (v == null) continue
      examScores[k] = (examScores[k] ?? 0) + v
    }
    for (const [k, v] of Object.entries(line.trimScores)) {
      if (v == null) continue
      trimScores[k] = (trimScores[k] ?? 0) + v
    }
    if (line.annualScore != null) {
      annualScore = (annualScore ?? 0) + line.annualScore
    }
  }
  return { periodScores, examScores, trimScores, annualScore }
}

function sameBarème(a: BulletinBranchLine, b: BulletinBranchLine) {
  return (
    a.maxPeriode === b.maxPeriode &&
    a.maxExamen === b.maxExamen &&
    a.maxTrimestre === b.maxTrimestre &&
    a.maxAnnuel === b.maxAnnuel
  )
}

/** Blocs de branches partageant le même barème (pour une ligne Maxima commune). */
function chunkBySameMaxima(lines: BulletinBranchLine[]) {
  const chunks: BulletinBranchLine[][] = []
  for (const line of lines) {
    const last = chunks[chunks.length - 1]
    if (last && sameBarème(last[0], line)) last.push(line)
    else chunks.push([line])
  }
  return chunks
}

function periodShortLabel(name: string, fallback: string): string {
  // "1ère période" → "1ère P."
  const m = name.match(/(\d+)/)
  if (m) {
    const n = m[1]
    if (n === "1") return "1ère P."
    if (n === "2") return "2ème P."
    if (n === "3") return "3ème P."
    if (n === "4") return "4ème P."
    if (n === "5") return "5ème P."
    if (n === "6") return "6ème P."
    return `${n}ème P.`
  }
  return fallback
}

function Cell({
  text,
  bold,
  muted,
  focus,
  last,
  below,
}: {
  text: string
  bold?: boolean
  muted?: boolean
  focus?: boolean
  last?: boolean
  below?: boolean
}) {
  return (
    <Text
      style={[
        last ? s.cellLast : s.cell,
        bold ? s.cellBold : {},
        muted ? s.cellMuted : {},
        focus ? s.cellFocus : {},
        below ? s.cellBelow : {},
      ]}
    >
      {text || " "}
    </Text>
  )
}

function Hatch({ last }: { last?: boolean }) {
  return <View style={last ? s.hatchLast : s.hatch} />
}

/**
 * 4 colonnes / trimestre : P1 | P2 | Exam | Total  (+ Année)
 * mode:
 *  - score: points obtenus (si publié)
 *  - max: maxima (toujours)
 *  - fraction: obtenu/max (sous-totaux)
 *  - pct / place / application: synthèse
 */
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
  mode,
  bold,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  maxPeriode: number
  maxExamen: number
  maxTrimestre: number
  maxAnnuel: number
  periodScores?: Record<string, number | null>
  examScores?: Record<string, number | null>
  trimScores?: Record<string, number | null>
  annualScore?: number | null
  mode: "score" | "max" | "fraction"
  bold?: boolean
}) {
  const cells: ReactNode[] = []

  data.trimestres.forEach((t) => {
    t.periods.forEach((p) => {
      const visible = !!vis.periods[String(p.periodId)]
      const obtained = periodScores?.[String(p.periodId)] ?? null
      let text = ""
      let below = false
      if (mode === "max") text = maxPeriode > 0 ? fmtNum(maxPeriode) : "—"
      else if (mode === "fraction") {
        const f = fmtFraction(obtained, maxPeriode, visible)
        text = f.text
        below = f.below
      } else {
        const sc = fmtScore(obtained, maxPeriode, visible)
        text = sc.text
        below = sc.below
      }
      cells.push(
        <Cell
          key={`p-${p.periodId}-${mode}`}
          text={text}
          bold={bold}
          muted={mode === "max"}
          focus={isFocusPeriod(data, p.periodId)}
          below={below}
        />
      )
    })
    {
      const visible = !!vis.exams[String(t.periodGroupId)]
      const obtained = examScores?.[String(t.periodGroupId)] ?? null
      let text = ""
      let below = false
      if (mode === "max") text = maxExamen > 0 ? fmtNum(maxExamen) : "—"
      else if (mode === "fraction") {
        const f = fmtFraction(obtained, maxExamen, visible)
        text = f.text
        below = f.below
      } else {
        const sc = fmtScore(obtained, maxExamen, visible)
        text = sc.text
        below = sc.below
      }
      cells.push(
        <Cell
          key={`ex-${t.periodGroupId}-${mode}`}
          text={text}
          bold={bold}
          muted={mode === "max"}
          focus={isFocusExam(data, t.periodGroupId)}
          below={below}
        />
      )
    }
    {
      const visible = !!vis.trims[String(t.periodGroupId)]
      const obtained = trimScores?.[String(t.periodGroupId)] ?? null
      let text = ""
      let below = false
      if (mode === "max") text = maxTrimestre > 0 ? fmtNum(maxTrimestre) : "—"
      else if (mode === "fraction") {
        const f = fmtFraction(obtained, maxTrimestre, visible)
        text = f.text
        below = f.below
      } else {
        const sc = fmtScore(obtained, maxTrimestre, visible)
        text = sc.text
        below = sc.below
      }
      cells.push(
        <Cell
          key={`tr-${t.periodGroupId}-${mode}`}
          text={text}
          bold={bold}
          muted={mode === "max"}
          below={below}
        />
      )
    }
  })

  {
    let text = ""
    let below = false
    if (mode === "max") text = maxAnnuel > 0 ? fmtNum(maxAnnuel) : "—"
    else if (mode === "fraction") {
      const f = fmtFraction(annualScore ?? null, maxAnnuel, vis.year)
      text = f.text
      below = f.below
    } else {
      const sc = fmtScore(annualScore ?? null, maxAnnuel, vis.year)
      text = sc.text
      below = sc.below
    }
    cells.push(
      <Cell
        key={`an-${mode}`}
        text={text}
        bold={bold}
        muted={mode === "max"}
        below={below}
        last
      />
    )
  }

  return <>{cells}</>
}

function SummaryCells({
  data,
  vis,
  student,
  mode,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  student: BulletinStudentPayload
  mode: "maxima" | "pct" | "place" | "application"
}) {
  const byKey = new Map(student.summaries.map((x) => [x.key, x]))
  const cells: ReactNode[] = []

  const render = (
    key: string,
    visible: boolean,
    maxFallback: number
  ): string => {
    const slice = byKey.get(key)
    if (mode === "maxima") {
      const max = slice?.maxTotal ?? maxFallback
      return fmtNum(max)
    }
    if (!visible) return ""
    if (mode === "pct") return fmtPct(slice?.percentage)
    if (mode === "place")
      return fmtPlace(slice?.place ?? null, data.studentCount)
    if (mode === "application") return slice?.application || ""
    return ""
  }

  data.trimestres.forEach((t) => {
    t.periods.forEach((p) => {
      cells.push(
        <Cell
          key={`s-p-${p.periodId}`}
          text={render(
            `period:${p.periodId}`,
            !!vis.periods[String(p.periodId)],
            0
          )}
          bold
          focus={isFocusPeriod(data, p.periodId)}
        />
      )
    })
    cells.push(
      <Cell
        key={`s-ex-${t.periodGroupId}`}
        text={render(
          `exam:${t.periodGroupId}`,
          !!vis.exams[String(t.periodGroupId)],
          0
        )}
        bold
        focus={isFocusExam(data, t.periodGroupId)}
      />
    )
    cells.push(
      <Cell
        key={`s-tr-${t.periodGroupId}`}
        text={render(
          `trim:${t.periodGroupId}`,
          !!vis.trims[String(t.periodGroupId)],
          0
        )}
        bold
      />
    )
  })
  cells.push(
    <Cell
      key="s-an"
      text={render("year", vis.year, 0)}
      bold
      last
    />
  )
  return <>{cells}</>
}

/** Conduite : périodes OK ; Exam + Total hachurés par trimestre + Année. */
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
    cells.push(<Hatch key={`h-ex-${t.periodGroupId}`} />)
    cells.push(<Hatch key={`h-tr-${t.periodGroupId}`} />)
  })
  cells.push(<Hatch key="h-an" last />)
  return <>{cells}</>
}

function DomainBlock({
  data,
  vis,
  domainName,
  lines,
  sub,
}: {
  data: PrimaryBulletinPayload
  vis: BulletinVisibility
  domainName: string
  lines: BulletinBranchLine[]
  sub: BulletinDomainSubtotal | undefined
}) {
  const sections = groupDomainSections(lines)
  const showGroupHeaders = sections.some((s) => s.groupName != null)
  // Plusieurs groupes → sous-total par groupe + sous-total domaine
  const showGroupSubtotals = showGroupHeaders && sections.length > 1

  return (
    <View>
      <View style={s.domainRow}>
        <Text style={s.domainText}>{domainName}</Text>
      </View>

      {sections.map((section, sIdx) => {
        const groupSub =
          showGroupSubtotals && section.groupName
            ? {
                ...sumLinesMaxima(section.lines),
                ...sumLinesScores(section.lines),
              }
            : null
        const maximaChunks = chunkBySameMaxima(section.lines)

        return (
          <View key={`${section.groupName ?? "ungrouped"}-${sIdx}`}>
            {showGroupHeaders && section.groupName ? (
              <View style={s.groupRow}>
                <Text style={s.groupText}>{section.groupName}</Text>
              </View>
            ) : null}

            {maximaChunks.map((chunk, cIdx) => {
              const ref = chunk[0]
              return (
                <View key={`chunk-${ref.subjectId}-${cIdx}`}>
                  {/* Maxima commun aux cours de même pondération */}
                  <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
                    <View style={s.branchCell}>
                      <Text
                        style={{
                          fontSize: 6.5,
                          fontFamily: "Helvetica-Oblique",
                        }}
                      >
                        Maxima
                      </Text>
                    </View>
                    <ScoreCells
                      data={data}
                      vis={vis}
                      maxPeriode={ref.maxPeriode}
                      maxExamen={ref.maxExamen}
                      maxTrimestre={ref.maxTrimestre}
                      maxAnnuel={ref.maxAnnuel}
                      mode="max"
                      bold
                    />
                  </View>

                  {chunk.map((line, i) => (
                    <View
                      key={line.subjectId}
                      style={[s.row, i % 2 === 1 ? s.rowZebra : {}]}
                      wrap={false}
                    >
                      <View style={s.branchCell}>
                        <Text style={{ fontSize: 6.5 }}>{line.name}</Text>
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
                        mode="score"
                      />
                    </View>
                  ))}
                </View>
              )
            })}

            {groupSub ? (
              <View style={[s.row, { backgroundColor: ZEBRA }]} wrap={false}>
                <View style={s.branchCell}>
                  <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}>
                    Sous-total
                  </Text>
                </View>
                <ScoreCells
                  data={data}
                  vis={vis}
                  maxPeriode={groupSub.maxPeriode}
                  maxExamen={groupSub.maxExamen}
                  maxTrimestre={groupSub.maxTrimestre}
                  maxAnnuel={groupSub.maxAnnuel}
                  periodScores={groupSub.periodScores}
                  examScores={groupSub.examScores}
                  trimScores={groupSub.trimScores}
                  annualScore={groupSub.annualScore}
                  mode="fraction"
                  bold
                />
              </View>
            ) : null}
          </View>
        )
      })}

      {sub ? (
        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <View style={s.branchCell}>
            <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold" }}>
              {showGroupSubtotals ? "Sous-total domaine" : "Sous-total"}
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
            mode="fraction"
            bold
          />
        </View>
      ) : null}
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
  const vis = data.visibility
  const addressLine = [data.school.schoolAddress, data.school.schoolCity]
    .filter(Boolean)
    .join(", ")

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
          <Text style={s.meta}>
            {[addressLine, data.school.schoolPhone, data.school.schoolEmail]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </View>

      <View style={s.titleRow}>
        <Text style={s.titleMain}>Bulletin de notes</Text>
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
        </View>
      </View>

      <View style={s.table}>
        {/* En-tête groupes */}
        <View style={s.headRow}>
          <View style={s.branchHead}>
            <Text style={s.headFg}>Branches / Domaines</Text>
          </View>
          {data.trimestres.map((t) => (
            <View
              key={t.periodGroupId}
              style={[s.groupHead, { width: 4 * COL_W }]}
            >
              <Text style={s.headFg}>{t.name}</Text>
            </View>
          ))}
          <View style={[s.groupHead, { width: COL_W, borderRightWidth: 0 }]}>
            <Text style={s.headFg}>Année</Text>
          </View>
        </View>

        {/* Sous-en-têtes */}
        <View style={s.subHeadRow}>
          <View style={s.branchHead}>
            <Text style={s.subFg}> </Text>
          </View>
          {data.trimestres.map((t) => (
            <View key={t.periodGroupId} style={{ flexDirection: "row" }}>
              {t.periods.map((p, i) => (
                <View
                  key={p.periodId}
                  style={[
                    s.colHead,
                    isFocusPeriod(data, p.periodId) ? s.colHeadFocus : {},
                  ]}
                >
                  <Text style={s.subFg}>
                    {periodShortLabel(p.name, `${i + 1}P`)}
                  </Text>
                </View>
              ))}
              <View
                style={[
                  s.colHead,
                  isFocusExam(data, t.periodGroupId) ? s.colHeadFocus : {},
                ]}
              >
                <Text style={s.subFg}>Exam.</Text>
              </View>
              <View style={s.colHead}>
                <Text style={s.subFg}>Total</Text>
              </View>
            </View>
          ))}
          <View style={s.colHeadLast}>
            <Text style={s.subFg}>TOTAL</Text>
          </View>
        </View>

        {domains.map((domain) => (
          <DomainBlock
            key={domain.name}
            data={data}
            vis={vis}
            domainName={domain.name}
            lines={domain.lines}
            sub={student.domainSubtotals.find(
              (d) => d.domainName === domain.name
            )}
          />
        ))}

        {/* Synthèse globale */}
        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={s.summaryLabel}>Maxima générale</Text>
          <SummaryCells
            data={data}
            vis={vis}
            student={student}
            mode="maxima"
          />
        </View>
        <View style={s.row} wrap={false}>
          <Text style={s.summaryLabel}>Pourcentage</Text>
          <SummaryCells data={data} vis={vis} student={student} mode="pct" />
        </View>
        <View style={[s.row, { backgroundColor: ZEBRA }]} wrap={false}>
          <Text style={s.summaryLabel}>Place</Text>
          <SummaryCells data={data} vis={vis} student={student} mode="place" />
        </View>
        <View style={s.row} wrap={false}>
          <Text style={s.summaryLabel}>Application</Text>
          <SummaryCells
            data={data}
            vis={vis}
            student={student}
            mode="application"
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
        Points visibles uniquement pour les périodes/examens publiés. Branches
        regroupées par domaine et sous-domaine ; ligne Maxima au-dessus des
        cours de même pondération. Notes sous la moyenne (moins de 50 % du max)
        en rouge avec astérisque (*) pour l&apos;impression N&amp;B. Application
        dérivée du %. Conduite : périodes seulement (cases noires = non
        applicables).
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
  /** Page blanche finale — contournement viewer Chrome qui tronque la dernière page en iframe. */
  trailingBlankPage = false,
}: {
  data: PrimaryBulletinPayload
  trailingBlankPage?: boolean
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
      {trailingBlankPage ? (
        <Page size="A4" orientation="portrait" style={{ backgroundColor: "#ffffff" }}>
          <Text style={{ fontSize: 1, color: "#ffffff" }}>.</Text>
        </Page>
      ) : null}
    </Document>
  )
}
