// ===== EINHERJAR BLITZ - SERVICE WORKER ===== //

const CACHE_NAME = 'einherjar-blitz-v1.0.0';
const urlsToCache = [
    '/game/battle.html',
    '/assets/css/battle-mobile.css',
    '/game/js/mobile-utils.js',
    '/characters/index.js',
    '/game/js/BattleSystem.js',
    '/game/js/BattleUI.js',
    '/game/js/BattleEffects.js',
    '/game/js/battle.js',
    '/images/default.jpg',
    '/images/ozen.jpg',
    '/images/shuna.jpg',
    '/images/xair.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('[SW] Cache failed:', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
    // Solo manejar requests GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devolver desde cache si existe
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }

                // Fetch desde red
                return fetch(event.request)
                    .then((response) => {
                        // Verificar si es una respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonar la respuesta
                        const responseToCache = response.clone();

                        // Añadir a cache solo recursos del juego
                        if (event.request.url.includes('/game/') || 
                            event.request.url.includes('/assets/') ||
                            event.request.url.includes('/characters/') ||
                            event.request.url.includes('/images/')) {
                            
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    })
                    .catch(() => {
                        // Fallback para pages offline
                        if (event.request.destination === 'document') {
                            return caches.match('/game/battle.html');
                        }
                    });
            })
    );
});

// Manejo de mensajes desde la app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Sincronización en background
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(
            // Aquí puedes sincronizar datos del juego
            syncGameData()
        );
    }
});

// Notificaciones push (para futuras features)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/images/icon-192.png',
        badge: '/images/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Einherjar Blitz', options)
    );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/game/battle.html')
        );
    }
});

// Función auxiliar para sincronizar datos
async function syncGameData() {
    try {
        // Implementar sincronización de estadísticas, progreso, etc.
        console.log('[SW] Syncing game data...');
        
        // Ejemplo: enviar estadísticas pendientes
        const pendingStats = await getStoredStats();
        if (pendingStats.length > 0) {
            await sendStatsToServer(pendingStats);
            await clearStoredStats();
        }
        
        return Promise.resolve();
    } catch (error) {
        console.log('[SW] Sync failed:', error);
        return Promise.reject(error);
    }
}

// Funciones auxiliares para IndexedDB (ejemplo)
async function getStoredStats() {
    // Implementar lectura de IndexedDB
    return [];
}

async function sendStatsToServer(stats) {
    // Implementar envío al servidor
    console.log('[SW] Sending stats:', stats);
}

async function clearStoredStats() {
    // Implementar limpieza de IndexedDB
    console.log('[SW] Stats cleared');
}

// Manejo de errores globales
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');
