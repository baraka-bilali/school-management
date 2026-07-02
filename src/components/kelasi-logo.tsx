"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

type KelasiLogoProps = {
  className?: string
  priority?: boolean
  /** light = fond clair (K/360 noirs), dark = fond sombre (K/360 blancs), auto = selon le thème */
  variant?: "light" | "dark" | "auto"
}

export default function KelasiLogo({
  className = "h-24 w-auto object-contain",
  priority,
  variant = "auto",
}: KelasiLogoProps) {
  const [isDarkBg, setIsDarkBg] = useState(variant === "dark")

  useEffect(() => {
    if (variant !== "auto") {
      setIsDarkBg(variant === "dark")
      return
    }

    const readTheme = () => {
      const saved = localStorage.getItem("theme") as "light" | "dark" | null
      if (saved) {
        setIsDarkBg(saved === "dark")
        return
      }
      setIsDarkBg(document.documentElement.classList.contains("dark"))
    }

    readTheme()
    window.addEventListener("storage", readTheme)
    window.addEventListener("themeChange", readTheme)
    return () => {
      window.removeEventListener("storage", readTheme)
      window.removeEventListener("themeChange", readTheme)
    }
  }, [variant])

  const src = isDarkBg ? "/Kelasi360-dark.png" : "/Kelasi360-light.png"

  return (
    <Image
      src={src}
      alt="Kelasi 360"
      width={280}
      height={120}
      className={className}
      priority={priority}
    />
  )
}
