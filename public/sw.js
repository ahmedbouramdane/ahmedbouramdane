const VERSION = "v1";
const CACHE_PREFIX = "study-";
const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`;
const PAGE_CACHE = `${CACHE_PREFIX}pages-${VERSION}`;
const HOMEWORK_CACHE = `${CACHE_PREFIX}homeworks-${VERSION}`;
const SESSION_CACHE = `${CACHE_PREFIX}session-${VERSION}`;
const DASHBOARD_CACHE = `${CACHE_PREFIX}dashboard-${VERSION}`;
const NOTIFIED_CACHE = `${CACHE_PREFIX}notified-${VERSION}`;
const CURRENT_CACHES = [
  STATIC_CACHE,
  PAGE_CACHE,
  HOMEWORK_CACHE,
  SESSION_CACHE,
  DASHBOARD_CACHE,
  NOTIFIED_CACHE,
];

const STUDY_PATH = "/student-management";
const REMINDER_TAG = "homework-reminders";

const MAX_STATIC_ENTRIES = 80;
const MAX_HOMEWORK_ENTRIES = 6;
const MAX_PAGE_ENTRIES = 1;
const MAX_SESSION_ENTRIES = 1;
const MAX_DASHBOARD_ENTRIES = 1;
const MAX_NOTIFIED_ENTRIES = 60;
const MAX_RESPONSE_BYTES = 1_500_000;

const STATIC_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const HOMEWORK_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const DASHBOARD_MAX_AGE = 24 * 60 * 60 * 1000;
const PAGE_MAX_AGE = 24 * 60 * 60 * 1000;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a}main{max-width:28rem;padding:2rem;text-align:center}h1{font-size:1.5rem;margin:0 0 .5rem}p{color:#475569;margin:0}</style></head><body><main><h1>You are offline</h1><p>Open the study organizer once while connected to keep it available offline.</p></main></body></html>`;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntil(value) {
  if (!value) return null;
  const parts = String(value).split("-").map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

async function trimCache(cacheName, maxEntries, maxAge) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  if (requests.length === 0) return;
  const now = Date.now();
  const entries = [];
  for (const request of requests) {
    const response = await cache.match(request, { ignoreVary: true });
    const cachedAt = Number(response?.headers.get("x-sw-cached-at") ?? 0);
    entries.push({ request, cachedAt });
  }
  const expired = entries.filter(
    (entry) => entry.cachedAt && now - entry.cachedAt > maxAge,
  );
  for (const entry of expired) {
    await cache.delete(entry.request);
  }
  const remaining = entries
    .filter((entry) => !expired.includes(entry))
    .sort((a, b) => b.cachedAt - a.cachedAt);
  for (const entry of remaining.slice(maxEntries)) {
    await cache.delete(entry.request);
  }
}

async function cacheResponse(cacheName, request, response, maxEntries, maxAge) {
  if (!response || response.status !== 200 || !response.ok) return response;
  if (request.method !== "GET") return response;
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESPONSE_BYTES) return response;
  try {
    const cache = await caches.open(cacheName);
    const headers = new Headers(response.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.set("x-sw-cached-at", String(Date.now()));
    const stored = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await cache.put(request, stored);
    await trimCache(cacheName, maxEntries, maxAge);
  } catch {
  }
  return response;
}

async function matchCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  return (await cache.match(request, { ignoreVary: true })) ?? null;
}

async function networkFirst(request, cacheName, maxEntries, maxAge) {
  let response;
  try {
    response = await fetch(request);
  } catch {
    return (await matchCache(request, cacheName)) ?? Response.error();
  }
  if (response.status >= 500) {
    const cached = await matchCache(request, cacheName);
    if (cached) return cached;
  }
  if (response.status === 200) {
    await cacheResponse(cacheName, request, response, maxEntries, maxAge);
  }
  return response;
}

function normalizeNavigationRequest(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, {
    method: "GET",
    credentials: request.credentials,
    headers: { Accept: "text/html" },
  });
}

async function navigationStrategy(request) {
  const cacheKey = normalizeNavigationRequest(request);
  let response;
  try {
    response = await fetch(request);
  } catch {
    return (
      (await matchCache(cacheKey, PAGE_CACHE)) ??
      new Response(OFFLINE_HTML, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  }
  if (response.status >= 500) {
    const cached = await matchCache(cacheKey, PAGE_CACHE);
    if (cached) return cached;
  }
  if (response.status === 200) {
    await cacheResponse(PAGE_CACHE, cacheKey, response, MAX_PAGE_ENTRIES, PAGE_MAX_AGE);
  }
  return response;
}

async function showHomeworkNotifications(homeworks) {
  if (!Array.isArray(homeworks)) return;
  const due = homeworks
    .filter((homework) => {
      if (!homework || !homework.due_on) return false;
      if (homework.status === "submitted" || homework.status === "graded") return false;
      const days = daysUntil(homework.due_on);
      return days !== null && days <= 0;
    })
    .sort((a, b) => daysUntil(a.due_on) - daysUntil(b.due_on));
  if (due.length === 0) return;

  const today = localDateKey();
  const signature = due.map((homework) => homework.id).join(",");
  const notified = await caches.open(NOTIFIED_CACHE);
  const key = new URL(
    `__sw__/notified/${today}/${signature}`,
    self.location.origin,
  ).href;
  if (await notified.match(key)) return;

  const lines = due.slice(0, 3).map((homework) => {
    const days = daysUntil(homework.due_on);
    const when =
      days < 0
        ? `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`
        : "Due today";
    return `${homework.title} · ${when}`;
  });
  if (due.length > 3) lines.push(`+${due.length - 3} more`);

  const title =
    due.length === 1 ? due[0].title : `${due.length} homeworks need attention`;

  try {
    await self.registration.showNotification(title, {
      body: lines.join("\n"),
      icon: "/logo.png",
      badge: "/logo.png",
      tag: REMINDER_TAG,
      data: {
        url: `${self.registration.scope}${STUDY_PATH.slice(1)}?tab=homeworks`,
      },
    });
  } catch {
    return;
  }
  await notified.put(key, new Response("1"));
  await trimNotifiedCache();
}

async function trimNotifiedCache() {
  const cache = await caches.open(NOTIFIED_CACHE);
  const requests = await cache.keys();
  const today = localDateKey();
  for (const request of requests) {
    const match = request.url.match(/(\d{4}-\d{2}-\d{2})\/[^/]+$/);
    if (!match) continue;
    const age =
      (new Date(`${today}T00:00:00`).getTime() -
        new Date(`${match[1]}T00:00:00`).getTime()) /
      86_400_000;
    if (age > 3) await cache.delete(request);
  }
  const remaining = await cache.keys();
  if (remaining.length > MAX_NOTIFIED_ENTRIES) {
    for (const request of remaining.slice(
      0,
      remaining.length - MAX_NOTIFIED_ENTRIES,
    )) {
      await cache.delete(request);
    }
  }
}

async function refreshEndpoint(path, cacheName, maxEntries, maxAge) {
  try {
    const url = new URL(path, self.location.origin);
    const request = new Request(url.href, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const response = await fetch(request);
    if (!response.ok) return null;
    await cacheResponse(cacheName, request, response, maxEntries, maxAge);
    return response;
  } catch {
    return null;
  }
}

async function refreshHomeworks() {
  const response = await refreshEndpoint(
    "/api/study/homeworks?limit=1000",
    HOMEWORK_CACHE,
    MAX_HOMEWORK_ENTRIES,
    HOMEWORK_MAX_AGE,
  );
  if (!response) return;
  try {
    const payload = await response.clone().json();
    const items = Array.isArray(payload) ? payload : payload?.items;
    await showHomeworkNotifications(items);
  } catch {
  }
}

async function refreshStudyCache() {
  await Promise.all([
    refreshHomeworks(),
    refreshEndpoint(
      "/api/study/session",
      SESSION_CACHE,
      MAX_SESSION_ENTRIES,
      SESSION_MAX_AGE,
    ),
    refreshEndpoint(
      "/api/study/dashboard",
      DASHBOARD_CACHE,
      MAX_DASHBOARD_ENTRIES,
      DASHBOARD_MAX_AGE,
    ),
  ]);
}

async function clearStudyCache() {
  await Promise.all(
    [HOMEWORK_CACHE, SESSION_CACHE, DASHBOARD_CACHE, NOTIFIED_CACHE].map((name) =>
      caches.delete(name),
    ),
  );
}

async function precacheStudyApp() {
  try {
    const url = new URL(STUDY_PATH, self.location.origin);
    const request = new Request(url.href, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "text/html" },
    });
    const response = await fetch(request);
    if (!response.ok) return;
    await cacheResponse(PAGE_CACHE, request, response, MAX_PAGE_ENTRIES, PAGE_MAX_AGE);
    const html = await response.clone().text();
    const urls = new Set();
    for (const pattern of [/src="([^"]+)"/g, /href="([^"]+)"/g]) {
      let match;
      while ((match = pattern.exec(html))) {
        try {
          const asset = new URL(match[1], self.location.origin);
          if (
            asset.origin === self.location.origin &&
            asset.pathname.startsWith("/_next/static/")
          ) {
            urls.add(asset.href);
          }
        } catch {
        }
      }
    }
    await Promise.all(
      [...urls].map(async (assetUrl) => {
        try {
          const assetResponse = await fetch(assetUrl);
          if (assetResponse.ok) {
            await cacheResponse(
              STATIC_CACHE,
              new Request(assetUrl, { method: "GET" }),
              assetResponse,
              MAX_STATIC_ENTRIES,
              STATIC_MAX_AGE,
            );
          }
        } catch {
        }
      }),
    );
  } catch {
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precacheStudyApp()
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (url.pathname === "/api/study/homeworks") {
    event.respondWith(
      networkFirst(request, HOMEWORK_CACHE, MAX_HOMEWORK_ENTRIES, HOMEWORK_MAX_AGE),
    );
    return;
  }
  if (url.pathname === "/api/study/session") {
    event.respondWith(
      networkFirst(request, SESSION_CACHE, MAX_SESSION_ENTRIES, SESSION_MAX_AGE),
    );
    return;
  }
  if (url.pathname === "/api/study/dashboard") {
    event.respondWith(
      networkFirst(request, DASHBOARD_CACHE, MAX_DASHBOARD_ENTRIES, DASHBOARD_MAX_AGE),
    );
    return;
  }
  if (
    request.mode === "navigate" &&
    url.pathname.replace(/\/+$/, "") === STUDY_PATH
  ) {
    event.respondWith(navigationStrategy(request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/logo.png" ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      networkFirst(request, STATIC_CACHE, MAX_STATIC_ENTRIES, STATIC_MAX_AGE),
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data ?? {};
  if (data.type === "SHOW_HOMEWORK_NOTIFICATIONS") {
    event.waitUntil(showHomeworkNotifications(data.homeworks));
  } else if (data.type === "CLEAR_STUDY_CACHE") {
    event.waitUntil(clearStudyCache());
  } else if (data.type === "REFRESH_HOMEWORKS") {
    event.waitUntil(refreshHomeworks());
  } else if (data.type === "REFRESH_STUDY_CACHE") {
    event.waitUntil(refreshStudyCache());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === REMINDER_TAG) {
    event.waitUntil(refreshHomeworks());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === REMINDER_TAG) {
    event.waitUntil(refreshHomeworks());
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Homework reminder",
    body: "You have homework due soon.",
    tag: REMINDER_TAG,
    data: { url: `${self.registration.scope}${STUDY_PATH.slice(1)}?tab=homeworks` },
  };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: payload.tag ?? REMINDER_TAG,
      data: payload.data ?? {
        url: `${self.registration.scope}${STUDY_PATH.slice(1)}?tab=homeworks`,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url ??
      `${self.registration.scope}${STUDY_PATH.slice(1)}?tab=homeworks`,
    self.location.origin,
  );
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (new URL(client.url).origin === self.location.origin && "focus" in client) {
            if (client.url !== target.href && "navigate" in client) {
              client.navigate(target.href);
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(target.href);
      }),
  );
});

