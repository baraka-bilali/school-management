"use client"

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

/** Affiche une notification système avec le son natif de l'appareil (via le service worker ou l'API Notification). */
export async function showSystemNotification(
  title: string,
  body: string,
  options?: { url?: string; silent?: boolean }
) {
  if (typeof window === "undefined") return
  if (!("Notification" in window) || Notification.permission !== "granted") return

  const payload = { title, body, url: options?.url || "/" }
  const silent = options?.silent ?? false

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg.active) {
        reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload: { ...payload, silent } })
        return
      }
    }
  } catch {}

  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/favicon.png",
      badge: "/icons/favicon.png",
      tag: "kelasi360-notification",
      silent,
      data: { url: payload.url },
    })
    n.onclick = () => {
      window.focus()
      if (payload.url) window.location.href = payload.url
      n.close()
    }
  } catch {}
}
