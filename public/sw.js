// Scope: this CRM only. Never cache authenticated API responses or an old app shell.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
