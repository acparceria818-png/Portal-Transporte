// service-worker.js - ATUALIZADO
const CACHE = 'ac-transporte-v3';
const OFFLINE_URL = 'offline.html';

const assets = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'firebase-config.js',
  'logo.jpg',
  'avatar.png',
  'manifest.json',
  OFFLINE_URL,
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(assets))
      .then(() => self.skipWaiting())
  );
});

// Ativação
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Não cachear requisições do Firebase
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('firestore.googleapis.com')) {
    return;
  }
  
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retornar do cache se existir
        if (response) {
          return response;
        }

        // Tentar buscar da rede
        return fetch(event.request)
          .then(response => {
            // Se a resposta não for válida, retornar como está
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar resposta para armazenar no cache
            const responseToCache = response.clone();
            caches.open(CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se offline e for uma página, mostrar offline.html
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para outros recursos, retornar erro simples
            return new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Receber mensagens push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do AC Transporte',
    icon: 'logo.jpg',
    badge: 'logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir app',
        icon: 'logo.jpg'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: 'logo.jpg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AC Transporte', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
