// Transfert direct : mode hors ligne + mises à jour fiables.
// Pour forcer une nouvelle version, change le numéro ci-dessous (v14 -> v15...).
const CACHE = 'transfert-v14';
const ESSENTIELS = ['./', './index.html', './manifest.json'];
const OPTIONNELS = ['./icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './fond.jpg', './SedgwickAveDisplay-Regular.ttf'];

// Un fichier optionnel manquant sur GitHub ne bloque plus l'installation.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      const add = f => c.add(new Request(f, { cache: 'reload' }));
      return Promise.all(ESSENTIELS.map(add)).then(() => Promise.allSettled(OPTIONNELS.map(add)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  // La page : réseau d'abord (toujours la dernière version), cache si hors ligne.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-cache' }).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Le reste (image, police, icônes) : cache d'abord.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))
  );
});
