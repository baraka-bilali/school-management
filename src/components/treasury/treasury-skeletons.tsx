"use client"

import { Card, CardContent } from "@/components/ui/cards"

function Bone({ className, theme }: { className?: string; theme: "light" | "dark" }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} ${className ?? ""}`}
    />
  )
}

export function TreasuryFiltersSkeleton({ theme, withOutflowFilters }: { theme: "light" | "dark"; withOutflowFilters?: boolean }) {
  return (
    <Card theme={theme} className="rounded-2xl shadow-sm">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Bone key={i} theme={theme} className="h-9 w-24 rounded-xl" />
            ))}
          </div>
          <div className="flex gap-2">
            <Bone theme={theme} className="h-10 w-44 rounded-xl" />
            <Bone theme={theme} className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        {withOutflowFilters && (
          <div className="flex flex-wrap gap-3 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
            {[1, 2, 3].map((i) => (
              <Bone key={i} theme={theme} className="h-10 w-40 rounded-xl" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCardSkeleton({ theme }: { theme: "light" | "dark" }) {
  return (
    <Card theme={theme} className="rounded-2xl shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between mb-3">
          <Bone theme={theme} className="w-10 h-10 rounded-xl" />
          <Bone theme={theme} className="h-5 w-14 rounded-full" />
        </div>
        <Bone theme={theme} className="h-3 w-32 mb-2" />
        <Bone theme={theme} className="h-3 w-24 mb-3" />
        <Bone theme={theme} className="h-8 w-28" />
      </CardContent>
    </Card>
  )
}

function BalanceCardSkeleton({ theme }: { theme: "light" | "dark" }) {
  return <Bone theme={theme} className="rounded-2xl h-[140px] w-full" />
}

export function TreasuryOverviewContentSkeleton({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCardSkeleton theme={theme} />
        <SummaryCardSkeleton theme={theme} />
        <SummaryCardSkeleton theme={theme} />
        <BalanceCardSkeleton theme={theme} />
      </div>
      <Card theme={theme} className="rounded-2xl shadow-sm">
        <CardContent className="pt-5 pb-5 space-y-4">
          <Bone theme={theme} className="h-4 w-48" />
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Bone theme={theme} className="h-3 w-36" />
                <Bone theme={theme} className="h-3 w-8" />
              </div>
              <Bone theme={theme} className="h-2 w-full rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TableSkeleton({ theme, cols }: { theme: "light" | "dark"; cols: number }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  return (
    <div className={`border ${border} rounded-xl overflow-hidden`}>
      <div className={`px-3 py-2.5 border-b ${border} flex gap-3`}>
        {Array.from({ length: cols }, (_, i) => (
          <Bone key={i} theme={theme} className="h-3 w-16 flex-1" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`px-3 py-3 flex gap-3 border-b last:border-0 ${border}`}>
          <Bone theme={theme} className="h-4 flex-1" />
          <Bone theme={theme} className="h-4 w-14" />
          <Bone theme={theme} className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function TreasuryOutflowsContentSkeleton({
  theme,
  compactTables,
}: {
  theme: "light" | "dark"
  compactTables?: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCardSkeleton theme={theme} />
        <SummaryCardSkeleton theme={theme} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Bone theme={theme} className="h-10 w-64 rounded-xl" />
        <div className="flex gap-2">
          <Bone theme={theme} className="h-10 w-20 rounded-xl" />
          <Bone theme={theme} className="h-10 w-40 rounded-xl" />
          <Bone theme={theme} className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {compactTables ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card theme={theme} className="rounded-2xl shadow-sm">
            <CardContent className="pt-5">
              <Bone theme={theme} className="h-5 w-44 mb-4" />
              <TableSkeleton theme={theme} cols={4} />
            </CardContent>
          </Card>
          <Card theme={theme} className="rounded-2xl shadow-sm">
            <CardContent className="pt-5">
              <Bone theme={theme} className="h-5 w-40 mb-4" />
              <TableSkeleton theme={theme} cols={4} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card theme={theme} className="rounded-2xl shadow-sm">
          <CardContent className="pt-5">
            <Bone theme={theme} className="h-5 w-48 mb-4" />
            <TableSkeleton theme={theme} cols={6} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function TreasuryPageSkeleton({
  theme,
  variant = "overview",
}: {
  theme: "light" | "dark"
  variant?: "overview" | "outflows"
}) {
  return (
    <div className="space-y-6">
      <TreasuryFiltersSkeleton theme={theme} withOutflowFilters={variant === "outflows"} />
      {variant === "overview" ? (
        <TreasuryOverviewContentSkeleton theme={theme} />
      ) : (
        <TreasuryOutflowsContentSkeleton theme={theme} compactTables />
      )}
    </div>
  )
}
