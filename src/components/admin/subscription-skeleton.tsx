"use client"

type Theme = "light" | "dark"

export default function SubscriptionSkeleton({ theme = "light" }: { theme?: Theme }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const card = theme === "dark" ? "bg-gray-800" : "bg-white"
  const tabsBg = theme === "dark" ? "bg-gray-900" : "bg-gray-100"

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 shimmer-bg rounded-lg" />
          <div className="h-4 w-64 shimmer-bg rounded-md" />
        </div>
        <div className="h-10 w-32 shimmer-bg rounded-full" />
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 rounded-xl p-1 ${tabsBg}`}>
        <div className={`h-10 flex-1 rounded-lg shimmer-bg ${card}`} />
        <div className="h-10 flex-1 rounded-lg shimmer-bg opacity-60" />
      </div>

      {/* Main overview card */}
      <div className={`rounded-2xl border ${border} ${card} p-4 sm:p-6 lg:p-8`}>
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          {/* Circular progress placeholder */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-[200px] w-[200px] shimmer-bg rounded-full" />
            <div className="h-3 w-48 shimmer-bg rounded-md" />
          </div>

          {/* School + coverage details */}
          <div className="w-full flex-1 space-y-6">
            <div className="space-y-2">
              <div className="h-3 w-28 shimmer-bg rounded-md" />
              <div className="h-7 w-56 shimmer-bg rounded-md sm:w-72" />
            </div>

            <div className={`rounded-xl border p-4 ${border}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="h-4 w-36 shimmer-bg rounded-md" />
                <div className="h-5 w-40 shimmer-bg rounded-full" />
              </div>
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="space-y-2">
                  <div className="h-3 w-24 shimmer-bg rounded" />
                  <div className="h-5 w-40 shimmer-bg rounded-md" />
                </div>
                <div className="hidden h-4 w-4 shimmer-bg rounded sm:block" />
                <div className="space-y-2">
                  <div className="h-3 w-28 shimmer-bg rounded" />
                  <div className="h-5 w-40 shimmer-bg rounded-md" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${border}`}>
              <div className="mb-3 h-3 w-48 shimmer-bg rounded-md" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${border}`}>
                    <div className="space-y-2">
                      <div className="h-3 w-28 shimmer-bg rounded" />
                      <div className="h-4 w-44 shimmer-bg rounded-md" />
                    </div>
                    <div className="h-6 w-16 shimmer-bg rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`rounded-2xl border ${border} ${card} p-5`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 shimmer-bg rounded-xl" />
              <div className="h-4 w-32 shimmer-bg rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full shimmer-bg rounded-md" />
              <div className="h-3 w-4/5 shimmer-bg rounded-md" />
              <div className="h-3 w-2/3 shimmer-bg rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
