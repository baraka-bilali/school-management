import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Fond clair forcé — texte sombre même en mode sombre (modales login, etc.) */
  lightSurface?: boolean
}

const Input = React.memo(React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, lightSurface = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          lightSurface
            ? "field-on-light border-gray-300 placeholder:text-gray-400"
            : [
                "bg-white text-gray-900 placeholder:text-gray-400",
                "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:[color-scheme:dark]",
              ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
))
Input.displayName = "Input"

export { Input }
