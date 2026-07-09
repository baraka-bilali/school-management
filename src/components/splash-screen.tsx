"use client"

import Image from "next/image"

/** Clé de session : l'animation ne se rejoue pas si déjà vue dans la session. */
export const SPLASH_SESSION_KEY = "kelasi_splash_seen"

type SplashScreenProps = {
  /** Déclenche le fondu de sortie avant démontage. */
  leaving?: boolean
}

export default function SplashScreen({ leaving = false }: SplashScreenProps) {
  return (
    <div
      className={`splash-root fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden ${
        leaving ? "splash-leaving" : ""
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Anneaux pulsés en arrière-plan */}
        <span className="splash-ring splash-ring-1" />
        <span className="splash-ring splash-ring-2" />

        {/* Logo animé (pop + rebond façon Discord) */}
        <div className="splash-logo-pop relative flex h-28 w-28 items-center justify-center rounded-[26px] bg-white shadow-2xl">
          <Image
            src="/Kelasi360-logo.png"
            alt="Kelasi 360"
            width={160}
            height={160}
            priority
            className="h-20 w-20 object-contain"
          />
        </div>
      </div>

      {/* Points de chargement */}
      <div className="splash-dots mt-12 flex items-center gap-2">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
