import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000'

// Get user ID for personalized data - prioritizes logged-in user
const getUserId = () => {
    // First, check if there's a logged-in user
    const userStr = localStorage.getItem('user')
    if (userStr) {
        try {
            const user = JSON.parse(userStr)
            // Use the user's email or uid as unique identifier
            if (user.uid) return user.uid
            if (user.email) return 'email_' + user.email.replace(/[^a-zA-Z0-9]/g, '_')
            if (user.id) return user.id
        } catch (e) {
            console.log('Error parsing user from localStorage:', e)
        }
    }

    // Fallback: Generate or retrieve session-based ID for anonymous users
    let userId = localStorage.getItem('vaaya_user_id')
    if (!userId) {
        userId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        localStorage.setItem('vaaya_user_id', userId)
    }
    return userId
}

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token and user ID
api.interceptors.request.use(
    (config) => {
        // Choose token based on endpoint
        const isFirebaseEndpoint = config.url.includes('/users/onboard') ||
            config.url.includes('/users/me') ||
            config.url.includes('/ai-messages')

        const token = isFirebaseEndpoint ? localStorage.getItem('firebase_token') : localStorage.getItem('token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        // Always send user ID for personalized data
        const userId = getUserId()
        console.log('API Request - X-User-Id:', userId)
        config.headers['X-User-Id'] = userId
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Don't redirect, just let the app handle it
        }
        return Promise.reject(error)
    }
)

// API endpoints
export const questsApi = {
    getAll: () => api.get('/api/quests'),
    getById: (id) => api.get(`/api/quests/${id}`),
    getByLocation: (location) => api.get(`/api/quests/location/${location}`),
    startQuest: (questId) => api.post(`/api/quests/${questId}/start`),
    completeQuest: (questId, data) => api.post(`/api/quests/${questId}/complete`, data),
}

export const tripsApi = {
    getAll: () => api.get('/api/trips/'),
    getById: (id) => api.get(`/api/trips/${id}`),
    create: (data) => api.post('/api/trips/', data),
    updateStatus: (id, status) => api.put(`/api/trips/${id}/status`, { status }),
    addItinerary: (id, item) => api.post(`/api/trips/${id}/itinerary`, item),
    predict: (data) => api.post('/api/trips/predict', data),
}

export const aiApi = {
    generateHeatmap: (data) => api.post('/ai/heatmap', data),
    verifyQuest: (data) => api.post('/ai/verify-quest', data),
    chat: (message, context) => api.post('/ai/chat', { message, context }),
    generateItinerary: (data) => api.post('/ai/generate-itinerary', data),
    health: () => api.get('/ai/health'),
}

export const userApi = {
    getMe: () => api.get('/api/users/me'),
    getProfile: (userId) => api.get(`/api/users/profile/${userId}`),
    updateProfile: (data) => api.put('/api/users/profile', data),
    getNearbyLocals: (lat, lng) => api.get(`/api/users/locals/nearby?lat=${lat}&lng=${lng}`),
    updateFcmToken: (token) => api.post('/api/users/fcm-token', { fcm_token: token }),
    getPreferences: () => api.get('/api/users/preferences'),
    updatePreferences: (data) => api.post('/api/users/preferences', data),
    onboard: (data) => api.post('/api/users/onboard', data),
}

// AI Chat History API (persistent storage)
export const aiChatApi = {
    getMessages: () => api.get('/api/chat/ai-history/'),
    addMessage: (role, text) => api.post('/api/chat/ai-history/', { role, text }),
    clearHistory: () => api.delete('/api/chat/ai-history/'),
}

export const chatApi = {
    getConversations: () => api.get('/api/chat/conversations'),
    getMessages: (conversationId) => api.get(`/api/chat/messages/${conversationId}`),
    sendMessage: (data) => api.post('/api/chat/send', data),
    // Community - User to User
    getNearbyTravelers: () => api.get('/api/chat/travelers/nearby'),
    startConversation: (data) => api.post('/api/chat/conversations', data),
}

export const notificationApi = {
    subscribe: (topic) => api.post('/api/notifications/subscribe', { topic }),
    unsubscribe: (topic) => api.post('/api/notifications/unsubscribe', { topic }),
}

// Local Guide API endpoints
export const localGuideApi = {
    // Dashboard
    getDashboard: () => api.get('/api/local-guide/dashboard'),

    // Quest Management
    getMyQuests: () => api.get('/api/local-guide/quests'),
    createQuest: (data) => api.post('/api/local-guide/quests', data),
    updateQuest: (questId, data) => api.put(`/api/local-guide/quests/${questId}`, data),
    deleteQuest: (questId) => api.delete(`/api/local-guide/quests/${questId}`),

    // Traveler Submissions (Verification)
    getPendingSubmissions: (status = 'pending') => api.get(`/api/local-guide/submissions?status=${status}`),
    verifySubmission: (submissionId, data) => api.post(`/api/local-guide/submissions/${submissionId}/verify`, data),

    // Content Management (Stories, Tips, Hidden Gems)
    getMyContent: (type = '') => api.get(`/api/local-guide/content${type ? `?type=${type}` : ''}`),
    createContent: (data) => api.post('/api/local-guide/content', data),
    updateContent: (contentId, data) => api.put(`/api/local-guide/content/${contentId}`, data),
    deleteContent: (contentId) => api.delete(`/api/local-guide/content/${contentId}`),

    // Analytics
    getAnalytics: (period = 'month') => api.get(`/api/local-guide/analytics?period=${period}`),

    // Earnings
    getEarnings: () => api.get('/api/local-guide/earnings'),
    requestWithdrawal: (data) => api.post('/api/local-guide/earnings/withdraw', data),
}

// Hospitality API endpoints (New Layer)
export const hospitalityApi = {
    // Traveler - Browse Experiences
    getNearbyExperiences: (params) => api.get('/api/hospitality/experiences', { params }),
    getExperienceById: (id) => api.get(`/api/hospitality/experiences/${id}`),
    searchExperiences: (query) => api.get('/api/hospitality/experiences/search', { params: { q: query } }),

    // Traveler - Bookings
    createBooking: (data) => api.post('/api/hospitality/bookings', data),
    getMyBookings: () => api.get('/api/hospitality/bookings/me'),
    cancelBooking: (bookingId) => api.post(`/api/hospitality/bookings/${bookingId}/cancel`),

    // Traveler - Reviews
    submitReview: (experienceId, data) => api.post(`/api/hospitality/experiences/${experienceId}/review`, data),

    // Host - Experience Management
    getMyExperiences: () => api.get('/api/hospitality/host/experiences'),
    createExperience: (data) => api.post('/api/hospitality/host/experiences', data),
    updateExperience: (id, data) => api.put(`/api/hospitality/host/experiences/${id}`, data),
    deleteExperience: (id) => api.delete(`/api/hospitality/host/experiences/${id}`),

    // Host - Booking Management
    getHostBookings: () => api.get('/api/hospitality/host/bookings'),
    updateBooking: (bookingId, data) => api.put(`/api/hospitality/host/bookings/${bookingId}`, data),

    // Host - Stats & Analytics
    getHostStats: () => api.get('/api/hospitality/host/stats'),
    getHospitalityScore: () => api.get('/api/hospitality/host/score'),

    // Host - Reviews
    getHostReviews: () => api.get('/api/hospitality/host/reviews'),

    // Public - Top Hosts & Scoreboard
    getTopHosts: (city) => api.get('/api/hospitality/top-hosts', { params: { city } }),
    getHospitalityScoreboard: () => api.get('/api/hospitality/scoreboard'),
}

export default api
