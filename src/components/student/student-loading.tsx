"use client"

import { useStudentTheme } from "./use-student-theme"
import { cn } from "@/lib/utils"

type LoadingVariant = "default" | "cards" | "list" | "profile"

export default function StudentLoading({
  label = "Chargement…",
  variant = "default",
}: {
  label?: string
  variant?: LoadingVariant
}) {
  const { textMuted } = useStudentTheme()

  return (
    <div className="min-h-[55vh] w-full">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className={cn("h-5 w-40 rounded-md shimmer-bg", textMuted ? "" : "")} />
          <div className="h-9 w-24 rounded-xl shimmer-bg" />
        </div>

        {variant === "profile" && (
          <>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full shimmer-bg" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-52 shimmer-bg rounded-md" />
                <div className="h-4 w-32 shimmer-bg rounded-md" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-36 rounded-2xl shimmer-bg" />
              ))}
            </div>
          </>
        )}

        {variant === "list" && (
          <>
            <div className="h-4 w-64 rounded-md shimmer-bg" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border p-4">
                  <div className="h-10 w-10 rounded-xl shimmer-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-72 shimmer-bg rounded-md" />
                    <div className="h-3 w-44 shimmer-bg rounded-md" />
                    <div className="h-3 w-52 shimmer-bg rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(variant === "cards" || variant === "default") && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl shimmer-bg" />
              ))}
            </div>
            <div className="h-12 w-56 rounded-2xl shimmer-bg" />
          </>
        )}

        <p className={cn("text-center text-sm", textMuted)}>{label}</p>
      </div>
    </div>
  )
}
