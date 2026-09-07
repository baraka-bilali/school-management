"use client"

type Theme = "light" | "dark"

export default function SubscriptionSkeleton({ theme = "light" }: { theme?: Theme }) {
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const card = theme === "dark" ? "bg-gray-800" : "bg-white"
  const tabsBg = theme === "dark" ? "bg-gray-900" : "bg-gray-100"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 shimmer-bg rounded-lg" />
        <div className="h-4 w-64 shimmer-bg rounded-md" />
      </div>

      <div className={`flex gap-1 rounded-xl p-1 ${tabsBg}`}>
        <div className={`h-10 flex-1 rounded-lg shimmer-bg ${card}`} />
        <div className="h-10 flex-1 rounded-lg shimmer-bg opacity-60" />
      </div>

      <div className={`rounded-2xl border ${border} ${card} overflow-hidden`}>
        <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${border}`}>
          <div className="h-5 w-48 shimmer-bg rounded-md" />
          <div className="h-6 w-16 shimmer-bg rounded-full" />
        </div>
        <div className="flex items-center gap-5 px-5 py-6">
          <div className="h-[88px] w-[88px] shimmer-bg rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 shimmer-bg rounded" />
            <div className="h-7 w-36 shimmer-bg rounded-md" />
            <div className="h-4 w-24 shimmer-bg rounded" />
          </div>
        </div>
        <div className={`px-5 py-4 border-t ${border}`}>
          <div className="h-4 w-32 shimmer-bg rounded mb-2" />
          <div className="h-3 w-64 shimmer-bg rounded" />
        </div>
      </div>
    </div>
  )
}
