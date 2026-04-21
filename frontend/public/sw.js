// TaskVault service worker — handles web push notifications.

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_) {
        payload = { title: 'TaskVault', body: event.data ? event.data.text() : '' };
    }

    const title = payload.title || 'TaskVault';
    const options = {
        body: payload.body || '',
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: { url: payload.url || '/' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
            try {
                const clientUrl = new URL(client.url);
                if (clientUrl.origin === self.location.origin) {
                    await client.focus();
                    if ('navigate' in client) {
                        try { await client.navigate(targetUrl); } catch (_) {}
                    }
                    return;
                }
            } catch (_) {}
        }
        await self.clients.openWindow(targetUrl);
    })());
});
