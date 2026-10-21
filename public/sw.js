const CACHE_VERSION = 'pinos-cache-v3';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((claves) => Promise.all(claves.filter((c) => c !== CACHE_VERSION).map((c) => caches.delete(c))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_VERSION).then(async (cache) => {
            const enCache = await cache.match(request);

            const promesaRed = fetch(request).then((respuesta) => {
                if (respuesta && (respuesta.ok || respuesta.type === 'opaque')) {
                    cache.put(request, respuesta.clone());
                }
                return respuesta;
            }).catch(() => null);

            if (enCache) {
                promesaRed.catch(() => {});
                return enCache;
            }
            return (await promesaRed) || Response.error();
        })
    );
});
