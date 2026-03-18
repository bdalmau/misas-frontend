self.addEventListener("install", e => {
    e.waitUntil(
        caches.open("misa-cache").then(cache => {
            return cache.addAll([
                "/",
                "/index.html",
                "/styles.css",
                "/app.js"
            ]);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(resp => resp || fetch(e.request))
    );
});

self.addEventListener('activate', event => {
    // Borrar todo el cache para forzar login siempre
    caches.keys().then(keys => {
        return Promise.all(keys.map(key => caches.delete(key)));
    });
});