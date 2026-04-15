// Service worker mínimo: solo habilita instalabilidad.
// No cachea assets activamente para evitar versiones obsoletas en MVP.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  /* pasar al red directamente */
});
