"use client"

import { ArrowDownCircle, ArrowUpCircle, Landmark, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/cards"

interface TreasurySummaryCardsProps {
  theme: "light" | "dark"
  yearLabel: string
  incomePeriodLabel: string
  flowsPeriodLabel: string
  scolaireUsd: number
  scolaireCdf: number
  otherUsd: number
  otherCdf: number
  teacherPayments: number
  expensesUsd: number
  expensesCdf: number
  balanceUsd: number
  balanceCdf: number
  /** "all" = 4 cartes · "outflows" = salaires + dépenses uniquement */
  sections?: "all" | "outflows"
}

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n)
}

function FlowBadge({ type, theme }: { type: "in" | "out"; theme: "light" | "dark" }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
        type === "in"
          ? theme === "dark"
            ? "bg-green-500/20 text-green-400"
            : "bg-green-100 text-green-700"
          : theme === "dark"
            ? "bg-red-500/20 text-red-400"
            : "bg-red-100 text-red-600"
      }`}
    >
      {type === "in" ? "Entrée" : "Sortie"}
    </span>
  )
}

export function TreasurySummaryCards({
  theme,
  yearLabel,
  incomePeriodLabel,
  flowsPeriodLabel,
  scolaireUsd,
  scolaireCdf,
  otherUsd,
  otherCdf,
  teacherPayments,
  expensesUsd,
  expensesCdf,
  balanceUsd,
  balanceCdf,
  sections = "all",
}: TreasurySummaryCardsProps) {
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const greenAmount = theme === "dark" ? "text-green-400" : "text-green-600"
  const greenAmountSoft = theme === "dark" ? "text-green-500" : "text-green-500"
  const blueAmount = theme === "dark" ? "text-blue-400" : "text-blue-600"
  const orangeAmount = theme === "dark" ? "text-orange-400" : "text-orange-600"
  const orangeAmountSoft = theme === "dark" ? "text-orange-500" : "text-orange-500"
  const totalUsd = scolaireUsd + otherUsd
  const totalCdf = scolaireCdf + otherCdf
  const showIncome = sections === "all"
  const showOutflows = sections === "all" || sections === "outflows"
  const gridClass =
    sections === "outflows"
      ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"

  return (
    <div className={gridClass}>
      {/* Recettes */}
      {showIncome && (
      <Card theme={theme} className="rounded-2xl shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="w-5 h-5 text-green-500" />
            </div>
            <FlowBadge type="in" theme={theme} />
          </div>
          <p className={`text-xs ${textSecondary} uppercase font-semibold tracking-wide`}>
            Recettes (frais élèves)
          </p>
          <p className={`text-[11px] ${textSecondary} mt-0.5`}>
            {yearLabel}
            {incomePeriodLabel !== "Année complète" && (
              <span> · {incomePeriodLabel}</span>
            )}
          </p>
          <div className="mt-2 space-y-0.5">
            {(totalUsd > 0 || totalCdf === 0) && (
              <p className={`text-2xl font-bold ${greenAmount}`}>{fmt(totalUsd)} $</p>
            )}
            {totalCdf > 0 && (
              <p className={`text-base font-semibold ${greenAmountSoft}`}>{fmt(totalCdf)} FC</p>
            )}
            {totalUsd === 0 && totalCdf === 0 && (
              <p className={`text-2xl font-bold ${greenAmount}`}>0 $</p>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Salaires */}
      {showOutflows && (
      <Card theme={theme} className="rounded-2xl shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <FlowBadge type="out" theme={theme} />
          </div>
          <p className={`text-xs ${textSecondary} uppercase font-semibold tracking-wide`}>
            Salaires versés
          </p>
          <p className={`text-[11px] ${textSecondary} mt-0.5`}>{flowsPeriodLabel}</p>
          <p className={`text-2xl font-bold ${blueAmount} mt-2`}>{fmt(teacherPayments)} $</p>
        </CardContent>
      </Card>
      )}

      {/* Dépenses */}
      {showOutflows && (
      <Card theme={theme} className="rounded-2xl shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="w-5 h-5 text-orange-500" />
            </div>
            <FlowBadge type="out" theme={theme} />
          </div>
          <p className={`text-xs ${textSecondary} uppercase font-semibold tracking-wide`}>
            Dépenses diverses
          </p>
          <p className={`text-[11px] ${textSecondary} mt-0.5`}>{flowsPeriodLabel}</p>
          <div className="mt-2 space-y-0.5">
            {expensesUsd > 0 && (
              <p className={`text-2xl font-bold ${orangeAmount}`}>{fmt(expensesUsd)} $</p>
            )}
            {expensesCdf > 0 && (
              <p className={`text-base font-semibold ${orangeAmountSoft}`}>{fmt(expensesCdf)} FC</p>
            )}
            {expensesUsd === 0 && expensesCdf === 0 && (
              <p className={`text-2xl font-bold ${orangeAmount}`}>0 $</p>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Solde global — carte mise en avant */}
      {showIncome && (
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white p-5 shadow-lg flex flex-col justify-between min-h-[140px]">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
            Solde
          </span>
        </div>
        <div>
          <p className="text-xs text-white/70 uppercase font-semibold tracking-wide">Solde global</p>
          <p className={`text-2xl font-bold mt-1 ${balanceUsd >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {fmt(balanceUsd)} $
          </p>
          {balanceCdf !== 0 && (
            <p className={`text-base font-semibold ${balanceCdf >= 0 ? "text-emerald-300/90" : "text-red-300/90"}`}>
              {fmt(balanceCdf)} FC
            </p>
          )}
          <p className="text-[10px] text-white/50 mt-2 border-t border-white/10 pt-2">
            {yearLabel} · {flowsPeriodLabel}
          </p>
        </div>
      </div>
      )}
    </div>
  )
}

interface IncomeByTypeRow {
  typeFraisId: number
  typeFrais: string
  isDefault: boolean
  usd: number
  cdf: number
}

export function TreasuryIncomeBreakdown({
  theme,
  rows,
  exchangeRate,
  periodLabel,
}: {
  theme: "light" | "dark"
  rows: IncomeByTypeRow[]
  exchangeRate: number
  periodLabel?: string
}) {
  if (rows.length === 0) return null

  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-800"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const weights = rows.map((r) => r.usd + r.cdf / exchangeRate)
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1

  return (
    <Card theme={theme} className="rounded-2xl shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <p className={`text-sm font-semibold ${textColor}`}>Recettes par type de frais</p>
          {periodLabel && (
            <span className={`text-[11px] ${textSecondary}`}>{periodLabel}</span>
          )}
        </div>
        <div className="space-y-4">
          {rows.map((row, i) => {
            const pct = Math.round((weights[i] / totalWeight) * 100)
            return (
              <div key={row.typeFraisId}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className={`text-sm font-medium ${textColor}`}>
                    {row.typeFrais}
                    {row.isDefault && (
                      <span className="ml-1.5 text-[10px] font-semibold text-indigo-500">(défaut)</span>
                    )}
                  </p>
                  <span className={`text-xs font-semibold ${textSecondary}`}>{pct}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <div className={`mt-1 text-xs ${textSecondary}`}>
                  {row.usd > 0 && <span className={`font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>{fmt(row.usd)} $</span>}
                  {row.usd > 0 && row.cdf > 0 && " · "}
                  {row.cdf > 0 && <span className={`font-medium ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>{fmt(row.cdf)} FC</span>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
