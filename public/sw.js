/* Service worker Kelasi 360 — notifications système + cache léger */

const CACHE = "kelasi360-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/", "/manifest.webmanifest", "/icons/icon.svg"])
    )
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let data = { title: "Kelasi 360", body: "Nouvelle notification" }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: "kelasi360-notification",
      renotify: true,
      data: { url: data.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SHOW_NOTIFICATION") return
  const { title, body, url, silent } = event.data.payload || {}
  self.registration.showNotification(title || "Kelasi 360", {
    body: body || "Nouvelle notification",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: "kelasi360-notification",
    renotify: true,
    silent: silent === true,
    data: { url: url || "/" },
  })
})
