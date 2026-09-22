/**
 * Bulletin PDF — Éducation de Base (CTEB).
 * Branches | S1: 1P 2P Exam Tot | S2: 3P 4P Exam Tot | T.G. | Rep.%
 * Inspiré du bulletin primaire (disposition Kelasi), pas une copie du papier officiel.
 */

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type {
  SecondaryBulletinPayload,
  SecondaryBulletinStudentPayload,
  SecondaryBulletinBranchLine,
  SecondaryBulletinDomainSubtotal,
} from "@/lib/grading/secondary-bulletin"
import type { BulletinVisibility } from "@/lib/grading/primary-bulletin"

const PAGE_W = 595.28
const MX = 12
const MY = 8
const CONTENT_W = PAGE_W - MX * 2

const BRANCH_W = 108
/** 2 semestres × 4 + T.G. + Rep.% = 10 */
const N_COLS = 10
const COL_W = Math.floor((CONTENT_W - BRANCH_W) / N_COLS)
const TABLE_W = BRANCH_W + N_COLS * COL_W

const BORDER = "#1e293b"
const MUTED = "#64748b"
const HEAD_BG = "#0f4c5c"
const HEAD_FG = "#ffffff"
const LIGHT = "#ecfeff"
const ZEBRA = "#f8fafc"
const FOCUS = "#cffafe"
const BELOW_AVG = "#b91c1c"

const s = StyleSheet.create({
  page: {
    paddingTop: MY,
    paddingBottom: MY + 10,
    paddingLeft: MX,
    paddingRight: MX,
    fontFamily: "Helvetica",
    fontSize: 6.5,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  logo: { width: 24, height: 24, objectFit: "contain" },
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
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    marginBottom: 3,
  },
  titleMain: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textTransform: "uppercase",
  },
  titleSub: { fontSize: 5.5, color: "#a5f3fc" },
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
    width: 48,
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
  },
  idValue: { flex: 1, fontSize: 6.5, fontFamily: "Helvetica-Bold" },
  idPlain: { flex: 1, fontSize: 6.5 },
  table: {
    width: TABLE_W,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
  },
  headRow: { flexDirection: "row", backgroundColor: HEAD_BG },
  subHeadRow: {
    flexDirection: "row",
    backgroundColor: "#155e75",
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
    borderRightColor: "#0e7490",
    borderRightStyle: "solid",
  },
  groupHead: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#0e7490",
    borderRightStyle: "solid",
    paddingVertical: 2,
  },
  headFg: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: HEAD_FG,
    textAlign: "center",
    textTransform: "uppercase",
  },
  subFg: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: "#e0f2fe",
    textAlign: "center",
  },
  colHead: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#67e8f9",
    borderRightStyle: "solid",
    paddingVertical: 1.5,
  },
  colHeadLast: {
    width: COL_W,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1.5,
  },
  colHeadFocus: { backgroundColor: "#0891b2" },
  domainRow: {
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
  },
  domainText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  groupRow: {
    backgroundColor: "#e2e8f0",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  groupText: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    borderBottomStyle: "solid",
    minHeight: 8.5,
    alignItems: "center",
  },
  rowZebra: { backgroundColor: ZEBRA },
  branchCell: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  cell: {
    width: COL_W,
    textAlign: "center",
    fontSize: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#e2e8f0",
    borderRightStyle: "solid",
    paddingVertical: 0.5,
  },
  cellLast: {
    width: COL_W,
    textAlign: "center",
    fontSize: 6,
    paddingVertical: 0.5,
  },
  cellBold: { fontFamily: "Helvetica-Bold", fontSize: 6 },
  cellMuted: { color: MUTED, fontSize: 5.5 },
  cellFocus: { backgroundColor: FOCUS },
  cellBelow: { color: BELOW_AVG, fontFamily: "Helvetica-Bold" },
  summaryLabel: {
    width: BRANCH_W,
    paddingHorizontal: 2,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderRightStyle: "solid",
  },
  signRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    width: TABLE_W,
    alignSelf: "center",
  },
  signBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "solid",
    minHeight: 28,
    padding: 3,
  },
  signLabel: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  signHint: { fontSize: 5, color: MUTED, marginTop: 1 },
  sealImg: {
    width: 24,
    height: 24,
    objectFit: "contain",
    alignSelf: "center",
    marginTop: 1,
  },
  note: {
    width: TABLE_W,
    alignSelf: "center",
    fontSize: 5,
    color: MUTED,
    marginTop: 2,
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

function isFocusPeriod(data: SecondaryBulletinPayload, periodId: number) {
  return (
    data.focusEvent.kind === "PERIOD" && data.focusEvent.periodId === periodId
  )
}

function isFocusExam(data: SecondaryBulletinPayload, gid: number) {
  return (
    data.focusEvent.kind === "EXAM" && data.focusEvent.periodGroupId === gid
  )
}

function groupDomains(lines: SecondaryBulletinBranchLine[]) {
  const domains: Array<{ name: string; lines: SecondaryBulletinBranchLine[] }> =
    []
  for (const line of lines) {
    const last = domains[domains.length - 1]
    if (last && last.name === line.domainName) last.lines.push(line)
    else domains.push({ name: line.domainName, lines: [line] })
  }
  return domains
}

function groupDomainSections(lines: SecondaryBulletinBranchLine[]) {
  const sections: Array<{
    groupName: string | null
    lines: SecondaryBulletinBranchLine[]
  }> = []
  for (const line of lines) {
    const last = sections[sections.length - 1]
    if (last && last.groupName === line.groupName) last.lines.push(line)
    else sections.push({ groupName: line.groupName, lines: [line] })
  }
  return sections
}

function ScoreCell({
  text,
  below,
  focus,
  last,
  bold,
}: {
  text: string
  below?: boolean
  focus?: boolean
  last?: boolean
  bold?: boolean
}) {
  return (
    <Text
      style={[
        last ? s.cellLast : s.cell,
        bold ? s.cellBold : {},
        focus ? s.cellFocus : {},
        below ? s.cellBelow : {},
        !text ? s.cellMuted : {},
      ]}
    >
      {text}
    </Text>
  )
}

function BranchScoreRow({
  data,
  vis,
  line,
  zebra,
}: {
  data: SecondaryBulletinPayload
  vis: BulletinVisibility
  line: SecondaryBulletinBranchLine
  zebra: boolean
}) {
  return (
    <View style={[s.row, zebra ? s.rowZebra : {}]} wrap={false}>
      <View style={s.branchCell}>
        <Text style={{ fontSize: 6 }}>{line.name}</Text>
        <Text style={s.cellMuted}>
          max {fmtNum(line.maxPeriode)} · ex {fmtNum(line.maxExamen)}
        </Text>
      </View>
      {data.semestres.map((sem) => (
        <View key={sem.periodGroupId} style={{ flexDirection: "row" }}>
          {sem.periods.map((p) => {
            const sc = fmtScore(
              line.periodScores[String(p.periodId)],
              line.maxPeriode,
              !!vis.periods[String(p.periodId)]
            )
            return (
              <ScoreCell
                key={p.periodId}
                text={sc.text}
                below={sc.below}
                focus={isFocusPeriod(data, p.periodId)}
              />
            )
          })}
          {(() => {
            const sc = fmtScore(
              line.examScores[String(sem.periodGroupId)],
              line.maxExamen,
              !!vis.exams[String(sem.periodGroupId)]
            )
            return (
              <ScoreCell
                text={sc.text}
                below={sc.below}
                focus={isFocusExam(data, sem.periodGroupId)}
              />
            )
          })()}
          {(() => {
            const sc = fmtScore(
              line.semestreScores[String(sem.periodGroupId)],
              line.maxSemestre,
              !!vis.trims[String(sem.periodGroupId)]
            )
            return <ScoreCell text={sc.text} below={sc.below} bold />
          })()}
        </View>
      ))}
      {(() => {
        const sc = fmtScore(line.annualScore, line.maxAnnuel, vis.year)
        return <ScoreCell text={sc.text} below={sc.below} bold />
      })()}
      <ScoreCell
        last
        text={
          line.repechagePercent != null
            ? fmtPct(line.repechagePercent)
            : ""
        }
        bold={line.repechagePercent != null}
      />
    </View>
  )
}

function DomainSubtotalRow({
  data,
  vis,
  sub,
}: {
  data: SecondaryBulletinPayload
  vis: BulletinVisibility
  sub: SecondaryBulletinDomainSubtotal
}) {
  return (
    <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
      <View style={s.branchCell}>
        <Text style={s.cellBold}>Sous-total · {sub.domainName}</Text>
      </View>
      {data.semestres.map((sem) => (
        <View key={sem.periodGroupId} style={{ flexDirection: "row" }}>
          {sem.periods.map((p) => {
            const sc = fmtScore(
              sub.periodScores[String(p.periodId)],
              sub.maxPeriode,
              !!vis.periods[String(p.periodId)]
            )
            return (
              <ScoreCell
                key={p.periodId}
                text={sc.text}
                below={sc.below}
                bold
              />
            )
          })}
          {(() => {
            const sc = fmtScore(
              sub.examScores[String(sem.periodGroupId)],
              sub.maxExamen,
              !!vis.exams[String(sem.periodGroupId)]
            )
            return <ScoreCell text={sc.text} below={sc.below} bold />
          })()}
          {(() => {
            const sc = fmtScore(
              sub.semestreScores[String(sem.periodGroupId)],
              sub.maxSemestre,
              !!vis.trims[String(sem.periodGroupId)]
            )
            return <ScoreCell text={sc.text} below={sc.below} bold />
          })()}
        </View>
      ))}
      {(() => {
        const sc = fmtScore(sub.annualScore, sub.maxAnnuel, vis.year)
        return <ScoreCell text={sc.text} below={sc.below} bold />
      })()}
      <ScoreCell last text="" />
    </View>
  )
}

function DomainBlock({
  data,
  vis,
  domainName,
  lines,
  sub,
}: {
  data: SecondaryBulletinPayload
  vis: BulletinVisibility
  domainName: string
  lines: SecondaryBulletinBranchLine[]
  sub?: SecondaryBulletinDomainSubtotal
}) {
  const sections = groupDomainSections(lines)
  let zebra = false
  return (
    <View>
      <View style={s.domainRow} wrap={false}>
        <Text style={s.domainText}>{domainName}</Text>
      </View>
      {sections.map((sec) => (
        <View key={sec.groupName ?? "__none"}>
          {sec.groupName ? (
            <View style={s.groupRow} wrap={false}>
              <Text style={s.groupText}>{sec.groupName}</Text>
            </View>
          ) : null}
          {sec.lines.map((line) => {
            zebra = !zebra
            return (
              <BranchScoreRow
                key={line.subjectId}
                data={data}
                vis={vis}
                line={line}
                zebra={zebra}
              />
            )
          })}
        </View>
      ))}
      {sub ? <DomainSubtotalRow data={data} vis={vis} sub={sub} /> : null}
    </View>
  )
}

function SummaryCells({
  data,
  vis,
  student,
  mode,
}: {
  data: SecondaryBulletinPayload
  vis: BulletinVisibility
  student: SecondaryBulletinStudentPayload
  mode: "maxima" | "pct" | "place" | "application"
}) {
  const find = (key: string) => student.summaries.find((x) => x.key === key)

  return (
    <>
      {data.semestres.map((sem) => (
        <View key={sem.periodGroupId} style={{ flexDirection: "row" }}>
          {sem.periods.map((p) => {
            const slice = find(`period:${p.periodId}`)
            let text = ""
            if (mode === "maxima") text = fmtNum(slice?.maxTotal)
            else if (mode === "pct")
              text = vis.periods[String(p.periodId)]
                ? fmtPct(slice?.percentage ?? null)
                : ""
            else if (mode === "place")
              text = vis.periods[String(p.periodId)]
                ? fmtPlace(slice?.place ?? null, data.studentCount)
                : ""
            else
              text = vis.periods[String(p.periodId)]
                ? slice?.application || ""
                : ""
            return (
              <ScoreCell
                key={p.periodId}
                text={text}
                focus={isFocusPeriod(data, p.periodId)}
                bold={mode === "maxima"}
              />
            )
          })}
          {(() => {
            const slice = find(`exam:${sem.periodGroupId}`)
            let text = ""
            if (mode === "maxima") text = fmtNum(slice?.maxTotal)
            else if (mode === "pct")
              text = vis.exams[String(sem.periodGroupId)]
                ? fmtPct(slice?.percentage ?? null)
                : ""
            else if (mode === "place")
              text = vis.exams[String(sem.periodGroupId)]
                ? fmtPlace(slice?.place ?? null, data.studentCount)
                : ""
            else
              text = vis.exams[String(sem.periodGroupId)]
                ? slice?.application || ""
                : ""
            return (
              <ScoreCell
                text={text}
                focus={isFocusExam(data, sem.periodGroupId)}
                bold={mode === "maxima"}
              />
            )
          })()}
          {(() => {
            const slice = find(`trim:${sem.periodGroupId}`)
            let text = ""
            if (mode === "maxima") text = fmtNum(slice?.maxTotal)
            else if (mode === "pct")
              text = vis.trims[String(sem.periodGroupId)]
                ? fmtPct(slice?.percentage ?? null)
                : ""
            else if (mode === "place")
              text = vis.trims[String(sem.periodGroupId)]
                ? fmtPlace(slice?.place ?? null, data.studentCount)
                : ""
            else
              text = vis.trims[String(sem.periodGroupId)]
                ? slice?.application || ""
                : ""
            return <ScoreCell text={text} bold />
          })()}
        </View>
      ))}
      {(() => {
        const slice = find("year")
        let text = ""
        if (mode === "maxima") text = fmtNum(slice?.maxTotal)
        else if (mode === "pct")
          text = vis.year ? fmtPct(slice?.percentage ?? null) : ""
        else if (mode === "place")
          text = vis.year
            ? fmtPlace(slice?.place ?? null, data.studentCount)
            : ""
        else text = vis.year ? slice?.application || "" : ""
        return <ScoreCell text={text} bold />
      })()}
      <ScoreCell last text="" />
    </>
  )
}

function StudentPage({
  data,
  student,
  pageIndex,
  pageCount,
}: {
  data: SecondaryBulletinPayload
  student: SecondaryBulletinStudentPayload
  pageIndex: number
  pageCount: number
}) {
  const vis = data.visibility
  const domains = groupDomains(student.lines)
  const repechageNames = student.repechageSubjects.map((r) => r.name).join(", ")

  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        {data.school.logoUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
          <Image src={data.school.logoUrl} style={s.logo} />
        ) : null}
        <View style={s.schoolBlock}>
          <Text style={s.schoolName}>{data.school.schoolName}</Text>
          <Text style={s.meta}>
            {[data.school.schoolAddress, data.school.schoolCity]
              .filter(Boolean)
              .join(" · ")}
            {data.school.schoolPhone ? ` · ${data.school.schoolPhone}` : ""}
          </Text>
        </View>
      </View>

      <View style={s.titleRow}>
        <View>
          <Text style={s.titleMain}>
            Bulletin — Éducation de Base ({data.class.level})
          </Text>
          <Text style={s.titleSub}>
            {data.yearName} · {data.focusEvent.label}
            {data.focusEvent.groupName
              ? ` · ${data.focusEvent.groupName}`
              : ""}
          </Text>
        </View>
        <Text style={s.titleSub}>
          {data.visibility.publishedThroughLabel || "Aperçu"}
        </Text>
      </View>

      <View style={s.idGrid}>
        <View style={s.idCol}>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Élève</Text>
            <Text style={s.idValue}>{student.fullName}</Text>
          </View>
          <View style={s.idLine}>
            <Text style={s.idLabel}>Sexe / Né(e)</Text>
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
            <Text style={s.idLabel}>Cycle</Text>
            <Text style={s.idPlain}>2 semestres · 4 périodes</Text>
          </View>
        </View>
      </View>

      <View style={s.table}>
        <View style={s.headRow}>
          <View style={s.branchHead}>
            <Text style={s.headFg}>Branches / Domaines</Text>
          </View>
          {data.semestres.map((sem) => (
            <View
              key={sem.periodGroupId}
              style={[s.groupHead, { width: 4 * COL_W }]}
            >
              <Text style={s.headFg}>{sem.name}</Text>
            </View>
          ))}
          <View style={[s.groupHead, { width: COL_W }]}>
            <Text style={s.headFg}>T.G.</Text>
          </View>
          <View style={[s.groupHead, { width: COL_W, borderRightWidth: 0 }]}>
            <Text style={s.headFg}>Rep.%</Text>
          </View>
        </View>

        <View style={s.subHeadRow}>
          <View style={s.branchHead}>
            <Text style={s.subFg}> </Text>
          </View>
          {data.semestres.map((sem) => (
            <View key={sem.periodGroupId} style={{ flexDirection: "row" }}>
              {sem.periods.map((p, i) => (
                <View
                  key={p.periodId}
                  style={[
                    s.colHead,
                    isFocusPeriod(data, p.periodId) ? s.colHeadFocus : {},
                  ]}
                >
                  <Text style={s.subFg}>{p.shortLabel || `${i + 1}P`}</Text>
                </View>
              ))}
              <View
                style={[
                  s.colHead,
                  isFocusExam(data, sem.periodGroupId) ? s.colHeadFocus : {},
                ]}
              >
                <Text style={s.subFg}>Exam.</Text>
              </View>
              <View style={s.colHead}>
                <Text style={s.subFg}>Total</Text>
              </View>
            </View>
          ))}
          <View style={s.colHead}>
            <Text style={s.subFg}>TOTAL</Text>
          </View>
          <View style={s.colHeadLast}>
            <Text style={s.subFg}>%</Text>
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

        <View style={[s.row, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={s.summaryLabel}>Maxima généraux</Text>
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
      </View>

      <View style={s.signRow}>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Décision</Text>
          <Text style={s.signHint}>Passe / Double · Date</Text>
        </View>
        <View style={s.signBox}>
          <Text style={s.signLabel}>Chef d&apos;établissement</Text>
          <Text style={s.signHint}>Signature</Text>
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
        Semestres CTEB · Max période → examen×2 · semestre×4 · annuel×8 · Notes
        &lt; 50 % du max en rouge (*)
        {repechageNames
          ? ` · Repêchage : ${repechageNames}`
          : " · Colonne Rep.% = examen de repêchage"}
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

export default function SecondaryBulletinPDF({
  data,
  trailingBlankPage = false,
}: {
  data: SecondaryBulletinPayload
  trailingBlankPage?: boolean
}) {
  const students = data.students
  const pageCount = students.length + (trailingBlankPage ? 1 : 0)

  return (
    <Document>
      {students.map((student, i) => (
        <StudentPage
          key={student.enrollmentId}
          data={data}
          student={student}
          pageIndex={i}
          pageCount={Math.max(pageCount, 1)}
        />
      ))}
      {trailingBlankPage ? (
        <Page size="A4" style={s.page}>
          <Text style={{ fontSize: 8, color: MUTED }}> </Text>
        </Page>
      ) : null}
    </Document>
  )
}
