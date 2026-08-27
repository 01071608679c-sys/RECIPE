/* 달자의 레시피 — 오프라인에서도 열리게 해주는 조각 */
const V = 'dalza-recipe-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;

  /* 앱 화면 자체는 새것을 먼저 본다 — 고치면 바로 반영되도록 */
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then((res) => {
        const cp = res.clone();
        caches.open(V).then((c) => c.put('./index.html', cp));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* 나머지(글꼴·OCR 도구·아이콘)는 받아둔 것을 먼저 쓴다 */
  e.respondWith(
    caches.match(r).then((hit) => hit || fetch(r).then((res) => {
      if (res && res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r)))
  );
});
