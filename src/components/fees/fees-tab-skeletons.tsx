"use client"

import { Card, CardContent } from "@/components/ui/cards"

function Bone({ className, theme }: { className?: string; theme: "light" | "dark" }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} ${className ?? ""}`}
    />
  )
}

export function FeesStatsSkeleton({ theme, isCashier }: { theme: "light" | "dark"; isCashier?: boolean }) {
  const count = isCashier ? 3 : 4
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCashier ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} theme={theme}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-4">
              <Bone theme={theme} className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone theme={theme} className="h-3 w-24" />
                <Bone theme={theme} className="h-7 w-20" />
                <Bone theme={theme} className="h-2 w-full max-w-[140px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FeesOverviewSkeleton({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Card key={i} theme={theme}>
          <CardContent className="pt-5 space-y-4">
            <Bone theme={theme} className="h-5 w-48" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Bone theme={theme} className="h-3 w-20" />
                    <Bone theme={theme} className="h-3 w-16" />
                  </div>
                  <Bone theme={theme} className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FeesTypesSkeleton({ theme }: { theme: "light" | "dark" }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  return (
    <Card theme={theme}>
      <CardContent className="pt-5">
        <div className={`border ${border} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${border} flex gap-4`}>
            {[1, 2, 3, 4].map((i) => (
              <Bone key={i} theme={theme} className="h-3 w-20" />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`px-4 py-3 flex gap-4 items-center border-b last:border-0 ${border}`}>
              <Bone theme={theme} className="h-4 w-32" />
              <Bone theme={theme} className="h-3 w-40 flex-1" />
              <Bone theme={theme} className="h-3 w-8" />
              <Bone theme={theme} className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function FeesTarificationsSkeleton({ theme }: { theme: "light" | "dark" }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  return (
    <Card theme={theme}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex justify-between items-center">
          <Bone theme={theme} className="h-5 w-40" />
          <Bone theme={theme} className="h-9 w-36 rounded-xl" />
        </div>
        <div className={`border ${border} rounded-xl overflow-x-auto`}>
          <div className="min-w-[600px]">
            <div className={`px-4 py-3 border-b ${border} flex gap-6`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Bone key={i} theme={theme} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`px-4 py-3 flex gap-6 border-b last:border-0 ${border}`}>
                <Bone theme={theme} className="h-4 w-24" />
                <Bone theme={theme} className="h-4 w-28" />
                <Bone theme={theme} className="h-4 w-20" />
                <Bone theme={theme} className="h-4 w-16" />
                <Bone theme={theme} className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeesStudentsSkeleton({ theme }: { theme: "light" | "dark" }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  return (
    <Card theme={theme}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Bone theme={theme} className="h-10 w-56 rounded-xl" />
          <Bone theme={theme} className="h-10 w-36 rounded-xl" />
          <Bone theme={theme} className="h-10 w-40 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} theme={theme} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <div className={`border ${border} rounded-xl overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${border} flex gap-4`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Bone key={i} theme={theme} className="h-3 w-14" />
            ))}
          </div>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`px-4 py-3 flex items-center gap-4 border-b last:border-0 ${border}`}>
              <div className="flex-1 space-y-1.5">
                <Bone theme={theme} className="h-4 w-40" />
                <Bone theme={theme} className="h-3 w-16" />
              </div>
              <Bone theme={theme} className="h-3 w-24" />
              <Bone theme={theme} className="h-3 w-16" />
              <Bone theme={theme} className="h-3 w-16" />
              <Bone theme={theme} className="h-2 w-20 rounded-full" />
              <Bone theme={theme} className="h-6 w-16 rounded-full" />
              <Bone theme={theme} className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function FeesPaymentsSkeleton({ theme }: { theme: "light" | "dark" }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  return (
    <Card theme={theme}>
      <CardContent className="pt-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Bone theme={theme} className="h-8 w-28 rounded-full" key={i} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Bone theme={theme} className="h-8 w-32 rounded-full" key={`t-${i}`} />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Bone theme={theme} className="w-12 h-10 shrink-0" />
            <div className={`flex-1 rounded-2xl border ${border} p-4 space-y-3`}>
              <div className="flex gap-3">
                <Bone theme={theme} className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bone theme={theme} className="h-4 w-2/3" />
                  <Bone theme={theme} className="h-3 w-1/2" />
                </div>
                <Bone theme={theme} className="h-5 w-14" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function FeesTabSkeleton({
  tab,
  theme,
}: {
  tab: "overview" | "types" | "tarifications" | "students" | "payments"
  theme: "light" | "dark"
}) {
  switch (tab) {
    case "overview":
      return <FeesOverviewSkeleton theme={theme} />
    case "types":
      return <FeesTypesSkeleton theme={theme} />
    case "tarifications":
      return <FeesTarificationsSkeleton theme={theme} />
    case "students":
      return <FeesStudentsSkeleton theme={theme} />
    case "payments":
      return <FeesPaymentsSkeleton theme={theme} />
    default:
      return null
  }
}
