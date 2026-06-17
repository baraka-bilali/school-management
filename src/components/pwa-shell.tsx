"use client"

import { useEffect, useState } from "react"
import { Download, X, Bell, Smartphone } from "lucide-react"
import { registerServiceWorker } from "@/lib/register-service-worker"
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/system-notifications"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const INSTALL_DISMISSED_KEY = "pwa-install-dismissed"
const NOTIF_DISMISSED_KEY = "pwa-notif-dismissed"

function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function PwaShell() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    registerServiceWorker()

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) setTheme(savedTheme)

    const onTheme = () => {
      const t = localStorage.getItem("theme") as "light" | "dark" | null
      if (t) setTheme(t)
    }
    window.addEventListener("themeChange", onTheme)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!localStorage.getItem(INSTALL_DISMISSED_KEY) && !isStandalone()) {
        setShowInstall(true)
      }
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)

    if (isIos() && !isStandalone() && !localStorage.getItem(INSTALL_DISMISSED_KEY)) {
      setIosHint(true)
      setShowInstall(true)
    }

    if (getNotificationPermission() === "default" && !localStorage.getItem(NOTIF_DISMISSED_KEY)) {
      const t = setTimeout(() => setShowNotif(true), 2500)
      return () => {
        clearTimeout(t)
        window.removeEventListener("themeChange", onTheme)
        window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      }
    }

    return () => {
      window.removeEventListener("themeChange", onTheme)
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (iosHint || isIos()) {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1")
      setShowInstall(false)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowInstall(false)
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1")
  }

  const handleEnableNotif = async () => {
    await requestNotificationPermission()
    setShowNotif(false)
    localStorage.setItem(NOTIF_DISMISSED_KEY, "1")
  }

  const isDark = theme === "dark"
  const card = isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
  const muted = isDark ? "text-gray-400" : "text-gray-600"

  if (!showInstall && !showNotif) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] flex flex-col gap-3 sm:left-auto sm:right-4 sm:max-w-sm pointer-events-none">
      {showInstall && (
        <div className={`pointer-events-auto rounded-2xl border shadow-2xl p-4 ${card}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              {iosHint ? <Smartphone className="w-5 h-5 text-indigo-500" /> : <Download className="w-5 h-5 text-indigo-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Installer digiSchool</p>
              <p className={`text-xs mt-1 ${muted}`}>
                {iosHint
                  ? "Sur iPhone/iPad : touchez Partager puis « Sur l'écran d'accueil »."
                  : "Accédez à l'application comme une app native depuis votre écran d'accueil."}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex-1 rounded-lg bg-indigo-600 text-white text-xs font-medium py-2 px-3 hover:bg-indigo-700"
                >
                  {iosHint ? "Compris" : "Installer"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInstall(false); localStorage.setItem(INSTALL_DISMISSED_KEY, "1") }}
                  className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "border-gray-600" : "border-gray-300"}`}
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button type="button" onClick={() => { setShowInstall(false); localStorage.setItem(INSTALL_DISMISSED_KEY, "1") }} className={muted}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showNotif && (
        <div className={`pointer-events-auto rounded-2xl border shadow-2xl p-4 ${card}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Activer les notifications</p>
              <p className={`text-xs mt-1 ${muted}`}>
                Recevez les alertes avec le son de votre appareil, même quand l'app est en arrière-plan.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleEnableNotif}
                  className="flex-1 rounded-lg bg-green-600 text-white text-xs font-medium py-2 px-3 hover:bg-green-700"
                >
                  Autoriser
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNotif(false); localStorage.setItem(NOTIF_DISMISSED_KEY, "1") }}
                  className={`rounded-lg border px-3 py-2 text-xs ${isDark ? "border-gray-600" : "border-gray-300"}`}
                >
                  Non merci
                </button>
              </div>
            </div>
            <button type="button" onClick={() => { setShowNotif(false); localStorage.setItem(NOTIF_DISMISSED_KEY, "1") }} className={muted}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
