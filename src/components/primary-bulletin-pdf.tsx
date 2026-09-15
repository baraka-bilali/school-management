import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { PrimaryBulletinPayload, BulletinStudentPayload } from "@/lib/grading/primary-bulletin"

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    borderBottomStyle: "solid",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "70%",
  },
  logo: { maxWidth: 56, maxHeight: 56, objectFit: "contain" },
  schoolName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  slogan: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  meta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  badge: {
    backgroundColor: "#4f46e5",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 8,
  },
  label: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: { fontSize: 9, color: "#111827", fontFamily: "Helvetica-Bold" },
  valueMuted: { fontSize: 9, color: "#4b5563" },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "solid",
    borderRadius: 6,
    marginBottom: 10,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  domainRow: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  domainText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
  },
  colBranch: { flex: 1 },
  colPts: { width: 56, textAlign: "right" },
  colMax: { width: 56, textAlign: "right" },
  colPct: { width: 48, textAlign: "right" },
  cell: { fontSize: 8, color: "#111827" },
  cellMuted: { fontSize: 8, color: "#6b7280" },
  footerTotals: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  totalLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  totalValue: {
    width: 56,
    textAlign: "right",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
  },
  sealRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    minHeight: 80,
  },
  seal: { width: 72, height: 72, objectFit: "contain" },
  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    paddingTop: 6,
  },
})

function fmtPts(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return `${n.toFixed(1)} %`
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
  const domains: Array<{ name: string; lines: typeof student.lines }> = []
  for (const line of student.lines) {
    const last = domains[domains.length - 1]
    if (last && last.name === line.domainName) last.lines.push(line)
    else domains.push({ name: line.domainName, lines: [line] })
  }

  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          {data.school.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={data.school.logoUrl} style={s.logo} />
          ) : null}
          <View>
            <Text style={s.schoolName}>{data.school.schoolName || "Établissement"}</Text>
            {data.school.slogan ? (
              <Text style={s.slogan}>{data.school.slogan}</Text>
            ) : null}
            {data.school.schoolAddress ? (
              <Text style={s.meta}>{data.school.schoolAddress}</Text>
            ) : null}
            {(data.school.schoolPhone || data.school.schoolEmail) && (
              <Text style={s.meta}>
                {[data.school.schoolPhone, data.school.schoolEmail]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
          </View>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>Bulletin</Text>
        </View>
      </View>

      <Text style={s.title}>
        Bulletin scolaire — {data.event.groupName} · {data.event.label}
      </Text>

      <View style={s.infoGrid}>
        <View style={s.infoBox}>
          <Text style={s.label}>Élève</Text>
          <Text style={s.value}>{student.fullName}</Text>
          <Text style={s.valueMuted}>
            Code {student.code || "—"}
          </Text>
        </View>
        <View style={s.infoBox}>
          <Text style={s.label}>Classe</Text>
          <Text style={s.value}>{data.class.name}</Text>
          <Text style={s.valueMuted}>
            Titulaire : {data.class.titulaireName || "—"}
          </Text>
        </View>
        <View style={s.infoBox}>
          <Text style={s.label}>Année</Text>
          <Text style={s.value}>{data.yearName}</Text>
          <Text style={s.valueMuted}>
            Moyenne : {fmtPct(student.percentage)}
          </Text>
        </View>
      </View>

      <View style={s.table}>
        <View style={s.tableHead}>
          <Text style={[s.colBranch, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            Branche
          </Text>
          <Text style={[s.colPts, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            Points
          </Text>
          <Text style={[s.colMax, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            Max
          </Text>
          <Text style={[s.colPct, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            %
          </Text>
        </View>

        {domains.map((domain) => (
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
                  <Text style={[s.colBranch, s.cell]}>
                    {line.name}
                    {line.groupName ? ` (${line.groupName})` : ""}
                  </Text>
                  <Text style={[s.colPts, s.cell]}>{fmtPts(line.obtained)}</Text>
                  <Text style={[s.colMax, s.cellMuted]}>
                    {fmtPts(line.maxPoints)}
                  </Text>
                  <Text style={[s.colPct, s.cellMuted]}>{fmtPct(pct)}</Text>
                </View>
              )
            })}
          </View>
        ))}

        <View style={s.footerTotals}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{fmtPts(student.totalObtained)}</Text>
          <Text style={[s.colMax, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            {fmtPts(student.totalMax)}
          </Text>
          <Text style={[s.colPct, s.cell, { fontFamily: "Helvetica-Bold" }]}>
            {fmtPct(student.percentage)}
          </Text>
        </View>
      </View>

      {data.school.sealUrl ? (
        <View style={s.sealRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image */}
          <Image src={data.school.sealUrl} style={s.seal} />
        </View>
      ) : null}

      <Text
        style={s.pageFooter}
        render={() =>
          `Kelasi 360 · ${data.school.schoolName} · ${pageIndex + 1}/${pageCount}`
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
