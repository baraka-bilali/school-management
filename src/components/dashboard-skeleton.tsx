"use client"

type Theme = "light" | "dark"

export default function DashboardSkeleton({ theme = "light" }: { theme?: Theme }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 shimmer-bg rounded-lg" />
        <div className="h-4 w-40 shimmer-bg rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 120 }} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={`rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 320 }} />
        <div className={`rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 320 }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`lg:col-span-2 rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 320 }} />
        <div className={`rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 320 }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 280 }} />
        <div className={`lg:col-span-2 rounded-2xl border ${border} p-5 shimmer-bg`} style={{ minHeight: 280 }} />
      </div>
    </div>
  )
}
