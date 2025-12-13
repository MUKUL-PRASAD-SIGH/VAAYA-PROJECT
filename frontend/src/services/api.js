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

    // Public - Top Hosts & Scoreboard
    getTopHosts: (city) => api.get('/api/hospitality/top-hosts', { params: { city } }),
    getHospitalityScoreboard: () => api.get('/api/hospitality/scoreboard'),
}

// Geo-Fenced Posts/Reels API endpoints
export const postsApi = {
    // Create a new post with media
    createPost: (formData) => api.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Get posts within user's geographic radius
    getNearbyPosts: (lat, lng, radius = 10, limit = 50) =>
        api.get('/api/posts/nearby', { params: { lat, lng, radius, limit } }),

    // Get a single post by ID
    getPost: (id) => api.get(`/api/posts/${id}`),

    // Get current user's posts
    getMyPosts: () => api.get('/api/posts/my'),

    // Like/unlike a post
    likePost: (id) => api.post(`/api/posts/${id}/like`),

    // Record a view on a post
    viewPost: (id) => api.post(`/api/posts/${id}/view`),

    // Delete a post
    deletePost: (id) => api.delete(`/api/posts/${id}`),

    // Get media URL
    getMediaUrl: (fileId) => `${API_BASE_URL}/api/posts/media/${fileId}`,

    // Comments
    getComments: (postId, limit = 50) =>
        api.get(`/api/posts/${postId}/comments`, { params: { limit } }),
    addComment: (postId, text) =>
        api.post(`/api/posts/${postId}/comments`, { text }),
    deleteComment: (postId, commentId) =>
        api.delete(`/api/posts/${postId}/comments/${commentId}`),
    likeComment: (postId, commentId) =>
        api.post(`/api/posts/${postId}/comments/${commentId}/like`),

    // Trending & Discovery
    getTrendingPosts: (lat, lng, radius = 25, limit = 20) =>
        api.get('/api/posts/trending', { params: { lat, lng, radius, limit } }),
    searchByHashtag: (hashtag, lat, lng, radius = 50) =>
        api.get(`/api/posts/hashtag/${hashtag}`, { params: { lat, lng, radius } }),
    getTrendingHashtags: (lat, lng, radius = 25, limit = 10) =>
        api.get('/api/posts/hashtags/trending', { params: { lat, lng, radius, limit } }),

    // Stories
    getNearbyStories: (lat, lng, radius = 10, limit = 50) =>
        api.get('/api/posts/stories', { params: { lat, lng, radius, limit } }),

    // Share
    sharePost: (id) => api.post(`/api/posts/${id}/share`),
}

export default api


