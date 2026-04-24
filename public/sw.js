// ─── PrivMITLab Service Worker ────────────────────────────
const CACHE_NAME = 'privmitlab-v1';
const AUDIO_CACHE = 'privmitlab-audio-v1';

// Assets to cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/manifest.json',
];

// Install — precache shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== AUDIO_CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET
    if (request.method !== 'GET') return;

    // Skip YouTube/external API calls
    if (
        url.hostname.includes('youtube.com') ||
        url.hostname.includes('googlevideo.com') ||
        url.hostname.includes('piped.video') ||
        url.hostname.includes('invidious') ||
        url.hostname.includes('api.deezer.com') ||
        url.hostname.includes('radio-browser') ||
        url.hostname.includes('i.ytimg.com') ||
        url.hostname.includes('i.scdn.co') ||
        url.hostname.includes('cdns-images.dzcdn.net')
    ) return;

    // Cache-first for static assets
    if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => cached);
            })
        );
        return;
    }

    // Network-first for HTML
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok && url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    );
});

// ─── Background Audio Keep-Alive ──────────────────────────
self.addEventListener('message', (event) => {
    if (event.data?.type === 'KEEP_ALIVE') {
        event.source?.postMessage({ type: 'KEEP_ALIVE_ACK' });
    }

    if (event.data?.type === 'AUDIO_PLAYING') {
        self.audioPlaying = true;
        self.currentSong = event.data.song || null;

        // ─── CRITICAL: Show persistent notification ───
        // Android won't kill an app with an active notification
        if (self.currentSong) {
            self.registration.showNotification('🎵 PrivMITLab', {
                body: self.currentSong.title + ' — ' + (self.currentSong.artist || ''),
                icon: '/favicon.svg',
                tag: 'now-playing',
                silent: true,
                requireInteraction: true,
            }).catch(function () { });
        }
    }

    if (event.data?.type === 'AUDIO_STOPPED') {
        self.audioPlaying = false;
        self.currentSong = null;

        // Clear the notification
        self.registration.getNotifications({ tag: 'now-playing' }).then(function (notifs) {
            notifs.forEach(function (n) { n.close(); });
        }).catch(function () { });
    }
});

// Handle notification click — bring app to foreground
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            if (clients.length > 0) {
                clients[0].focus();
            } else {
                self.clients.openWindow('/');
            }
        })
    );
});