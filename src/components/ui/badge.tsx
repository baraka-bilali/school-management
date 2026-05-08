import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.memo(function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700",
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"

export { Badge }
