"use client"

type Theme = "light" | "dark"

export default function StudentDetailSkeleton({ theme = "light" }: { theme?: Theme }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"

  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shimmer-bg rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 w-36 shimmer-bg rounded-md" />
            <div className="h-3 w-48 shimmer-bg rounded-md" />
          </div>
        </div>
        <div className="h-9 w-28 shimmer-bg rounded-lg" />
      </div>

      <div className={`rounded-xl border ${border} p-5`}>
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <div className="h-20 w-20 shrink-0 shimmer-bg rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-64 shimmer-bg rounded-md" />
            <div className="h-4 w-40 shimmer-bg rounded-md" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-16 shimmer-bg rounded-full" />
              <div className="h-6 w-28 shimmer-bg rounded-full" />
              <div className="h-6 w-14 shimmer-bg rounded-full" />
            </div>
          </div>
          <div className="h-16 w-16 shrink-0 shimmer-bg rounded-xl" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`overflow-hidden rounded-xl border ${border}`}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 shimmer-bg rounded" />
              <div className="h-4 w-56 shimmer-bg rounded-md" />
            </div>
            <div className="h-4 w-4 shimmer-bg rounded" />
          </div>
          <div className={`border-t ${border} px-5 py-5`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-24 shimmer-bg rounded" />
                  <div className="h-4 w-full shimmer-bg rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
