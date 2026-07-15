"use client"

const SW_UPDATE_EVENT = "sw-update-available"

export function onServiceWorkerUpdate(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(SW_UPDATE_EVENT, callback)
  return () => window.removeEventListener(SW_UPDATE_EVENT, callback)
}

export async function applyServiceWorkerUpdate(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.waiting?.postMessage({ type: "SKIP_WAITING" })
  window.location.reload()
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing
      if (!newWorker) return
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT))
        }
      })
    })

    if (reg.waiting && navigator.serviceWorker.controller) {
      window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT))
    }

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Nouvelle version active après skipWaiting
    })

    // Vérifier les mises à jour toutes les heures
    setInterval(() => void reg.update(), 60 * 60 * 1000)

    return reg
  } catch (e) {
    console.warn("[PWA] Service worker registration failed:", e)
    return null
  }
}
