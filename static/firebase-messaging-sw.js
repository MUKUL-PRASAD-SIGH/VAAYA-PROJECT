// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'Vaaya';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/static/images/icon-192.png',
        badge: '/static/images/badge-72.png',
        data: payload.data,
        tag: payload.data?.tag || 'default',
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    // Get the URL to open from notification data
    const urlToOpen = event.notification.data?.url || '/dashboard';

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window/tab open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener('push', (event) => {
    if (event.data) {
        console.log('Push event received:', event.data.text());

        try {
            const data = event.data.json();
            const title = data.notification?.title || 'Vaaya';
            const options = {
                body: data.notification?.body || '',
                icon: '/static/images/icon-192.png',
                badge: '/static/images/badge-72.png',
                data: data.data,
                tag: data.data?.tag || 'default'
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }
});
