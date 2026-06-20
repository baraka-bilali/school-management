"use client"

import { playBing } from "@/lib/play-bing"

export type NotificationPermissionState = "default" | "granted" | "denied"

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied"
  return Notification.permission as NotificationPermissionState
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied"
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  const result = await Notification.requestPermission()
  return result as NotificationPermissionState
}

/** Affiche une notification système (son natif OS) via le service worker ou l'API Notification. */
export async function showSystemNotification(
  title: string,
  body: string,
  options?: { url?: string; silent?: boolean }
) {
  if (typeof window === "undefined") return
  if (!("Notification" in window) || Notification.permission !== "granted") {
    if (!options?.silent) playBing()
    return
  }

  const payload = { title, body, url: options?.url || "/" }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg.active) {
        reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload })
        return
      }
    }
  } catch {}

  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: "digischool-notification",
      silent: options?.silent ?? false,
      data: { url: payload.url },
    })
    n.onclick = () => {
      window.focus()
      if (payload.url) window.location.href = payload.url
      n.close()
    }
  } catch {
    if (!options?.silent) playBing()
  }
}
