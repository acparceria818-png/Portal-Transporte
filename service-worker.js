// service-worker.js - VERSÃO FUNCIONAL
const CACHE_NAME = 'ac-transporte-v2' + new Date().getTime();
const CORE_ASSETS = [
  './',                    // Página principal
  './index.html',          // HTML
  './styles.css',          // CSS
  './app.js',              // JS principal
  './firebase.js',         // Firebase
  './manifest.json'        // Manifest
];

// ========== INSTALAÇÃO ==========
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache aberto:', CACHE_NAME);
        
        // Tenta adicionar apenas arquivos que existem
        return Promise.all(
          CORE_ASSETS.map(asset => {
            return cache.add(asset)
              .then(() => {
                console.log('💾 Cacheado:', asset);
                return true;
              })
              .catch(error => {
                console.log('⚠️ Não pôde cachear:', asset, error);
                return false; // Não falha a instalação por um arquivo
              });
          })
        );
      })
      .then(() => {
        console.log('🚀 Instalação completa');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Erro na instalação:', error);
      })
  );
});

// ========== ATIVAÇÃO ==========
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('🎯 Claiming clients');
        return self.clients.claim();
      })
  );
});

// ========== FETCH ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições do Firebase
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis')) {
    return;
  }
  
  // Ignorar requisições de analytics
  if (url.hostname.includes('google-analytics')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se tem no cache, retorna
        if (cachedResponse) {
          console.log('📦 Retornando do cache:', url.pathname);
          return cachedResponse;
        }
        
        // Se não tem, busca na rede
        console.log('🌐 Buscando na rede:', url.pathname);
        
        return fetch(event.request)
          .then(networkResponse => {
            // Se resposta inválida, retorna como está
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clona a resposta para cache
            const responseToCache = networkResponse.clone();
            
            // Abre o cache e salva
            caches.open(CACHE_NAME)
              .then(cache => {
                // Verifica se é uma URL que queremos cachear
                const shouldCache = 
                  url.origin === self.location.origin || // Nossos arquivos
                  url.href.includes('cdnjs.cloudflare.com'); // Font Awesome
                
                if (shouldCache) {
                  cache.put(event.request, responseToCache);
                  console.log('💾 Salvo no cache:', url.pathname);
                }
              })
              .catch(cacheError => {
                console.log('⚠️ Erro ao salvar no cache:', cacheError);
              });
            
            return networkResponse;
          })
          .catch(fetchError => {
            console.log('🌐 Offline - Erro na rede:', fetchError);
            
            // Se é uma navegação (página HTML), retorna index.html
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html')
                .then(indexResponse => {
                  return indexResponse || new Response(
                    '<h1>Offline</h1><p>Você está offline. Conecte-se à internet.</p>',
                    { 
                      headers: { 'Content-Type': 'text/html' } 
                    }
                  );
                });
            }
            
            // Para outros recursos, retorna mensagem de erro
            return new Response(
              'Conteúdo indisponível offline',
              { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              }
            );
          });
      })
  );
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', event => {
  console.log('📬 Push notification recebida');
  
  let options = {
    body: 'Nova notificação do AC Transporte',
    icon: './logo.jpg',
    badge: './logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      url: './'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.body || options.body;
      options.data = { ...options.data, ...data };
    } catch (e) {
      options.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('AC Transporte', options)
  );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', event => {
  console.log('👆 Notificação clicada');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Se já tem uma janela aberta, foca nela
        for (let client of windowClients) {
          if (client.url === './' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não tem, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});

// ========== MENSAGEM ==========
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker carregado');
