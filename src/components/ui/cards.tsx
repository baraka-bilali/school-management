import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: "light" | "dark"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, theme = "light", ...props }, ref) => {
    const bgColor = theme === "dark" ? "bg-gray-800" : "bg-white"
    const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900"
    const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border shadow",
          bgColor,
          textColor,
          borderColor,
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
