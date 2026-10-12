// Lets Chrome offer "Install app" for the studio and deliver
// request, consultation and appointment notifications.
// It does not cache pages, inquiries, or prices.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

function studioPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" && payload.title ? payload.title : "Estudio";
  const body =
    typeof payload.body === "string" && payload.body
      ? payload.body
      : "Hay una solicitud, consulta o cita nueva.";
  const tag = typeof payload.tag === "string" ? payload.tag.slice(0, 80) : "studio";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/studio/icon-192.png",
      badge: "/studio/icon-192.png",
      lang: "es",
      tag,
      data: { url: studioPath(payload.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(studioPath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => client.url.includes("/admin"));
      if (open) {
        await open.focus();
        if (typeof open.navigate === "function") await open.navigate(destination);
        return;
      }
      await self.clients.openWindow(destination);
    })(),
  );
});
