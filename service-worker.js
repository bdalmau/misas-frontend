// NO cacheamos nada relacionado con login o index
self.addEventListener("install", event => {
    self.skipWaiting();
});

// Siempre cargar desde la red, nunca desde cache
self.addEventListener("fetch", event => {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// Al activar, borrar cualquier cache viejo
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
    self.clients.claim();
});
