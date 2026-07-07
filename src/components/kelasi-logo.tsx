"use client"

import Image from "next/image"

type KelasiLogoProps = {
  className?: string
  priority?: boolean
  /** Conservé pour compatibilité — le logo officiel est identique sur tous les fonds */
  variant?: "light" | "dark" | "auto"
}

export default function KelasiLogo({
  className = "h-24 w-24 object-contain",
  priority,
}: KelasiLogoProps) {
  return (
    <Image
      src="/Kelasi360-logo.png"
      alt="Kelasi 360"
      width={512}
      height={512}
      className={className}
      priority={priority}
    />
  )
}
