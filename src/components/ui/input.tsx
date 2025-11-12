import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = (ref || innerRef) as React.RefObject<HTMLInputElement>

    React.useEffect(() => {
      const input = combinedRef.current
      if (!input) return

      const forceWhiteText = () => {
        const isDark = document.documentElement.classList.contains('dark')
        if (isDark && input.matches(':-webkit-autofill')) {
          input.style.setProperty('-webkit-text-fill-color', 'white', 'important')
          input.style.setProperty('color', 'white', 'important')
        }
      }

      // Force white text on autofill in dark mode
      const handleAnimationStart = (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          forceWhiteText()
        }
      }

      // Listen for autofill animation
      input.addEventListener('animationstart', handleAnimationStart as EventListener)
      
      // Check immediately and repeatedly for autofilled state
      const checkInterval = setInterval(() => {
        forceWhiteText()
      }, 10)

      // Also check on input/change events
      const handleInput = () => {
        setTimeout(forceWhiteText, 10)
      }

      input.addEventListener('input', handleInput)
      input.addEventListener('change', handleInput)

      // Initial check
      setTimeout(forceWhiteText, 100)

      return () => {
        input.removeEventListener('animationstart', handleAnimationStart as EventListener)
        input.removeEventListener('input', handleInput)
        input.removeEventListener('change', handleInput)
        clearInterval(checkInterval)
      }
    }, [combinedRef])

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={combinedRef as any}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
