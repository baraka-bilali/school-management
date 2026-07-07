import { cn } from "@/lib/utils"

/** Hauteur minimale commune pour aligner le chargement dans tous les tableaux */
export const TABLE_LOADING_MIN_H = "min-h-[280px]"

type TableLoadingSpinnerProps = {
  message?: string
  className?: string
  textClassName?: string
}

export function TableLoadingSpinner({
  message = "Chargement...",
  className,
  textClassName,
}: TableLoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        TABLE_LOADING_MIN_H,
        className
      )}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      <p className={cn("text-sm", textClassName)}>{message}</p>
    </div>
  )
}

type TableLoadingRowProps = {
  colSpan: number
  message?: string
  textClassName?: string
  cellClassName?: string
}

export function TableLoadingRow({
  colSpan,
  message,
  textClassName,
  cellClassName,
}: TableLoadingRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn("px-3 py-0 text-center", cellClassName)}>
        <TableLoadingSpinner message={message} textClassName={textClassName} />
      </td>
    </tr>
  )
}

type TableLoadingBlockProps = {
  message?: string
  textClassName?: string
  className?: string
}

export function TableLoadingBlock({
  message,
  textClassName,
  className,
}: TableLoadingBlockProps) {
  return (
    <div className={cn("text-center", className)}>
      <TableLoadingSpinner message={message} textClassName={textClassName} />
    </div>
  )
}
