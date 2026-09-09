/** Événement navigateur pour resynchroniser le badge cloche après lecture/suppression. */
export const NOTIFICATIONS_CHANGED_EVENT = "notificationsMarkedRead"

export function notifyNotificationsChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
}
