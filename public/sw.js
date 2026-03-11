/**
 * Service Worker for Web Push Notifications.
 * This runs in the background even when the CRM tab is closed.
 */

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { title: 'FastestCRM', body: event.data.text() };
    }

    const title = payload.title || 'FastestCRM';
    const options = {
        body: payload.body || payload.message || '',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.tag || 'fastestcrm-notification',
        data: {
            url: payload.url || '/',
            leadId: payload.lead_id,
        },
        requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if one is open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    if (urlToOpen !== '/') {
                        client.navigate(urlToOpen);
                    }
                    return;
                }
            }
            // Otherwise open a new tab
            return clients.openWindow(self.location.origin + urlToOpen);
        })
    );
});

// Activate immediately when updated
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
