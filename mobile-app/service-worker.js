const CACHE_NAME = 'smart-travel-v1';
const ASSETS = [
  '/mobile-app/index.html',
  '/mobile-app/css/style.css',
  '/mobile-app/js/app.js',
  '/mobile-app/manifest.webmanifest'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME && caches.delete(k))))
  );
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(cached=> cached || fetch(e.request))
    );
  }
});


