// 동인행사 알리미 - Service Worker
// 브라우저 푸시 알림 수신 및 표시를 담당합니다.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// 푸시 수신 시 알림 표시
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "동인행사 알리미", body: event.data?.text() ?? "" };
  }

  const title = data.title ?? "동인행사 알리미";
  const options = {
    body: data.body ?? "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url ?? "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 해당 페이지로 이동
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭이 있으면 포커스
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        // 없으면 새 탭 열기
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
