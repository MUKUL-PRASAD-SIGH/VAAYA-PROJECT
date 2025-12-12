import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000'

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
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
    getProfile: (userId) => api.get(`/api/users/profile/${userId}`),
    updateProfile: (data) => api.put('/api/users/profile', data),
    getNearbyLocals: (lat, lng) => api.get(`/api/users/locals/nearby?lat=${lat}&lng=${lng}`),
    updateFcmToken: (token) => api.post('/api/users/fcm-token', { fcm_token: token }),
    getPreferences: () => api.get('/api/users/preferences'),
    updatePreferences: (data) => api.post('/api/users/preferences', data),
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
}

export const notificationApi = {
    subscribe: (topic) => api.post('/api/notifications/subscribe', { topic }),
    unsubscribe: (topic) => api.post('/api/notifications/unsubscribe', { topic }),
}

export default api
