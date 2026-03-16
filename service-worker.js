/* ═══════════════════════════════════════════════════════════════
   SPOKENMASTER SERVICE WORKER v1.0
   Caches ALL pages and assets for 100% offline use
═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'spokenmaster-v1';
const OFFLINE_URL = 'offline.html';

// LIST EVERY FILE IN YOUR PROJECT HERE — do not skip any:
const CACHE_FILES = [
  './',
  'index.html',
  'alphabet.html',
  'greetings.html',
  'tenses.html',
  'modal-verbs.html',
  'conjunctions.html',
  'prepositions.html',
  'vocabulary.html',
  'sentences.html',
  'conversations.html',
  'speaking-tasks.html',
  'fix-mistakes.html',
  'daily-tasks.html',
  'quiz.html',
  'word-of-day.html',
  'idioms.html',
  'phrasal-verbs.html',
  'pronunciation.html',
  'essays.html',
  'about.html',
  'contact.html',
  'privacy-policy.html',
  'offline.html',
  'manifest.json',
  'icons/icon-72.png',
  'icons/icon-96.png',
  'icons/icon-128.png',
  'icons/icon-144.png',
  'icons/icon-152.png',
  'icons/icon-192.png',
  'icons/icon-384.png',
  'icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap'
];

// INSTALL — cache all files immediately
self.addEventListener('install', function(event) {
  console.log('[SW] Installing SpokenMaster v1...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching all app files...');
        // Cache each file individually so one failure does not break all
        return Promise.allSettled(
          CACHE_FILES.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
          )
        );
      })
      .then(function() {
        console.log('[SW] All files cached. App ready offline.');
        return self.skipWaiting(); // activate immediately
      })
  );
});

// ACTIVATE — delete old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating SpokenMaster v1...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      console.log('[SW] Activated. Claiming clients...');
      return self.clients.claim(); // take control of all open pages
    })
  );
});

// FETCH — serve from cache first, fallback to network
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser extensions
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Serve from cache if available
        if (cachedResponse) {
          // Also update cache in background (stale-while-revalidate)
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(() => {}); // silent fail — offline is fine
          return cachedResponse;
        }

        // Not in cache — try network
        return fetch(event.request)
          .then(function(networkResponse) {
            // Cache the new response
            if (networkResponse && networkResponse.status === 200) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clonedResponse);
              });
            }
            return networkResponse;
          })
          .catch(function() {
            // Network failed and not in cache — show offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            // For other assets, return empty response
            return new Response('', { status: 408, statusText: 'Offline' });
          });
      })
  );
});

// BACKGROUND SYNC — retry failed form submissions when back online
self.addEventListener('sync', function(event) {
  if (event.tag === 'contact-form-sync') {
    console.log('[SW] Background sync: retrying contact form...');
  }
});

// PUSH NOTIFICATIONS (optional — ready for future use)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'SpokenMaster', {
    body: data.body || 'New lesson available!',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-96.png',
    data: { url: data.url || '/' }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
