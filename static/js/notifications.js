// Firebase Cloud Messaging - Push Notifications
// Import Firebase (using CDN in HTML)

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let messaging = null;

// Initialize Firebase
function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK not loaded');
            return;
        }

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Check if messaging is supported
        if (firebase.messaging.isSupported()) {
            messaging = firebase.messaging();
            console.log('Firebase Messaging initialized');

            // Request permission on page load
            requestNotificationPermission();

            // Handle foreground messages
            messaging.onMessage((payload) => {
                console.log('Message received:', payload);
                showNotificationToast(payload);
            });
        } else {
            console.log('Firebase Messaging not supported in this browser');
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}

// Request notification permission
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted');

            // Get FCM token
            const token = await messaging.getToken({
                vapidKey: 'YOUR_VAPID_KEY_HERE'
            });

            if (token) {
                console.log('FCM Token:', token);

                // Save token to backend
                await saveFCMToken(token);

                // Store locally
                localStorage.setItem('fcm_token', token);
            }
        } else {
            console.log('Notification permission denied');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

// Save FCM token to backend
async function saveFCMToken(token) {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        await axios.post('http://localhost:5000/api/users/fcm-token', {
            fcm_token: token
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('FCM token saved to backend');
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
}

// Show notification toast in browser
function showNotificationToast(payload) {
    const notification = payload.notification;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast fade-in';
    toast.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                    🔔
                </div>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800">${notification.title || 'Notification'}</h4>
                <p class="text-sm text-gray-600 mt-1">${notification.body || ''}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Subscribe to topic
async function subscribeToTopic(topic) {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        await axios.post('http://localhost:5000/api/notifications/subscribe', {
            topic: topic
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
        console.error('Error subscribing to topic:', error);
    }
}

// Unsubscribe from topic
async function unsubscribeFromTopic(topic) {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) return;

        await axios.post('http://localhost:5000/api/notifications/unsubscribe', {
            topic: topic
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
        console.error('Error unsubscribing from topic:', error);
    }
}

// Test notification
function testNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Vaaya Test', {
            body: 'Push notifications are working!',
            icon: '/static/images/icon-192.png',
            badge: '/static/images/badge-72.png',
            tag: 'test-notification'
        });

        notification.onclick = function () {
            window.focus();
            notification.close();
        };
    } else {
        console.log('Notifications not permitted or not supported');
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

// Auto-subscribe to all_users topic on login
const token = localStorage.getItem('token');
if (token) {
    subscribeToTopic('all_users');
}

// Export functions for use in other scripts
window.VaayaNotifications = {
    requestPermission: requestNotificationPermission,
    subscribe: subscribeToTopic,
    unsubscribe: unsubscribeFromTopic,
    test: testNotification
};
