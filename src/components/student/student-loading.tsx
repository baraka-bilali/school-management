"use client"

import { useStudentTheme } from "./use-student-theme"
import { cn } from "@/lib/utils"

type LoadingVariant =
  | "default"
  | "cards"
  | "list"
  | "profile"
  | "dashboard"
  | "fees"
  | "tasks"
  | "communiques"
  | "communiqueView"
  | "notifications"

export default function StudentLoading({
  label = "",
  variant = "default",
}: {
  label?: string
  variant?: LoadingVariant
}) {
  const { textMuted } = useStudentTheme()

  return (
    <div className="min-h-[55vh] w-full">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {variant === "dashboard" && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-7 w-56 shimmer-bg rounded-lg" />
                <div className="h-4 w-44 shimmer-bg rounded-lg" />
              </div>
              <div className="hidden h-12 w-44 rounded-2xl shimmer-bg lg:block" />
            </div>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              <div className="rounded-2xl border p-4 shimmer-bg lg:p-6" style={{ border: "1px solid transparent" }} />
              <div className="rounded-2xl border p-4 shimmer-bg lg:p-6" style={{ border: "1px solid transparent" }} />
            </div>

            <div className="rounded-2xl border p-3 shimmer-bg lg:p-4" style={{ border: "1px solid transparent" }}>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="h-3 w-6 rounded-md bg-transparent" />
                    <div className="h-9 w-9 rounded-full bg-transparent" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }}>
                <div className="h-5 w-32 rounded-md" />
                <div className="mt-4 h-20 w-full rounded-2xl" />
              </div>
              <div className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }}>
                <div className="h-5 w-36 rounded-md" />
                <div className="mt-4 h-20 w-full rounded-2xl" />
              </div>
            </div>
          </>
        )}

        {variant === "fees" && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-52 shimmer-bg rounded-lg" />
                <div className="h-4 w-64 shimmer-bg rounded-lg" />
              </div>
              <div className="h-6 w-12 shimmer-bg rounded-md hidden sm:block" />
            </div>

            <div className="rounded-2xl border p-5 shimmer-bg lg:p-6" style={{ border: "1px solid transparent" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="h-11 w-11 rounded-xl bg-transparent" />
                <div className="h-6 w-20 rounded-full bg-transparent" />
              </div>
              <div className="mt-3 h-4 w-44 rounded-md bg-transparent" />
              <div className="mt-2 h-10 w-60 rounded-lg bg-transparent" />
              <div className="mt-2 h-4 w-36 rounded-md bg-transparent" />
            </div>

            <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              <div className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }} />
              <div className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }} />
            </div>

            <div className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }}>
              <div className="h-5 w-56 rounded-md bg-transparent" />
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <div className="h-10 w-10 rounded-xl bg-transparent" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded-md bg-transparent" />
                      <div className="h-3 w-36 rounded-md bg-transparent" />
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {variant === "tasks" && (
          <>
            <div className="space-y-2">
              <div className="h-8 w-44 shimmer-bg rounded-lg" />
              <div className="h-4 w-56 shimmer-bg rounded-lg" />
            </div>

            <div className="rounded-2xl border p-10 shimmer-bg lg:p-16" style={{ border: "1px solid transparent" }}>
              <div className="mx-auto h-16 w-16 rounded-full bg-transparent" />
              <div className="mt-4 mx-auto h-5 w-36 rounded-md bg-transparent" />
              <div className="mt-3 mx-auto h-4 w-72 rounded-md bg-transparent" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border p-5 shimmer-bg" style={{ border: "1px solid transparent" }} />
              <div className="rounded-2xl border p-5 shimmer-bg" style={{ border: "1px solid transparent" }} />
            </div>
          </>
        )}

        {variant === "communiques" && (
          <>
            <div className="space-y-2">
              <div className="h-8 w-40 shimmer-bg rounded-lg" />
              <div className="h-4 w-64 shimmer-bg rounded-lg" />
            </div>

            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }}>
                  <div className="h-4 w-40 rounded-md bg-transparent" />
                  <div className="mt-3 h-5 w-56 rounded-lg bg-transparent" />
                  <div className="mt-2 h-3 w-72 rounded-md bg-transparent" />
                  <div className="mt-2 h-3 w-64 rounded-md bg-transparent" />
                </div>
              ))}
            </div>
          </>
        )}

        {variant === "notifications" && (
          <>
            <div className="space-y-2">
              <div className="h-8 w-44 shimmer-bg rounded-lg" />
              <div className="h-4 w-70 shimmer-bg rounded-lg" />
            </div>

            <div className="rounded-2xl border p-2 shimmer-bg" style={{ border: "1px solid transparent" }}>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded-xl bg-transparent" />
                <div className="h-10 rounded-xl bg-transparent" />
              </div>
            </div>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border p-4 shimmer-bg" style={{ border: "1px solid transparent" }}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-transparent" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-80 rounded-md bg-transparent" />
                      <div className="h-3 w-48 rounded-md bg-transparent" />
                    </div>
                    <div className="h-4 w-4 rounded-full bg-transparent" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {variant === "communiqueView" && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-md shimmer-bg" />
              <div className="h-4 w-36 rounded-md shimmer-bg" />
            </div>

            <div className="rounded-2xl border p-5 shimmer-bg" style={{ border: "1px solid transparent" }}>
              <div className="h-7 w-52 rounded-full bg-transparent" />
              <div className="mt-4 h-7 w-80 rounded-lg bg-transparent" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="h-4 w-full rounded-md bg-transparent" />
                <div className="h-4 w-full rounded-md bg-transparent" />
              </div>
              <div className="mt-6 h-20 w-full rounded-2xl bg-transparent" />
            </div>
          </>
        )}

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

        {label ? <p className={cn("text-center text-sm", textMuted)}>{label}</p> : null}
      </div>
    </div>
  )
}
