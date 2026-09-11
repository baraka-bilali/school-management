"use client"

import Image from "next/image"

/** Clé de session : l'animation ne se rejoue pas si déjà vue dans la session. */
export const SPLASH_SESSION_KEY = "kelasi_splash_seen"

type SplashScreenProps = {
  /** Déclenche le fondu de sortie avant démontage. */
  leaving?: boolean
}

/**
 * Splash Kelasi 360 — révélation de marque :
 * 1) fond dégradé inspiré du login
 * 2) logo qui apparaît au centre
 * 3) glissement doux vers la droite + apparition du mot « Kelasi 360 » à droite
 */
export default function SplashScreen({ leaving = false }: SplashScreenProps) {
  return (
    <div
      className={`splash-root fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${
        leaving ? "splash-leaving" : ""
      }`}
      role="img"
      aria-label="Kelasi 360"
    >
      <div className="splash-ambient" aria-hidden>
        <div className="splash-ambient-base" />
        <div className="splash-orb splash-orb-a" />
        <div className="splash-orb splash-orb-b" />
        <div className="splash-orb splash-orb-c" />
        <div className="splash-ambient-glow" />
        <div className="splash-ambient-grid" />
      </div>

      <div className="splash-brand relative z-10 flex items-center gap-3 sm:gap-4">
        <div className="splash-mark-shift shrink-0">
          <div className="splash-mark flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[1.35rem] bg-white shadow-[0_18px_50px_-18px_rgba(79,70,229,0.55)] sm:h-24 sm:w-24 sm:rounded-[1.5rem]">
            <Image
              src="/Kelasi360-logo.png"
              alt=""
              width={160}
              height={160}
              priority
              className="h-[4.25rem] w-[4.25rem] object-contain sm:h-20 sm:w-20"
            />
          </div>
        </div>

        <div className="splash-wordmark flex flex-col leading-none">
          <span className="splash-word-kelasi text-[1.65rem] font-semibold tracking-tight text-slate-800 sm:text-[1.85rem]">
            Kelasi
          </span>
          <span className="splash-word-360 mt-0.5 text-[1.65rem] font-semibold tracking-tight text-indigo-600 sm:text-[1.85rem]">
            360
          </span>
        </div>
      </div>
    </div>
  )
}
