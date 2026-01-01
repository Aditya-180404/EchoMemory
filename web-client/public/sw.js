/**
 * EchoMemory Service Worker
 * Enabling Offline Read-Access
 */

const CACHE_NAME = 'echomemory-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/src/app.js',
    '/assets/lang/en.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Strategy: Cache First, then Network
    // For API calls: Network First, then Cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
