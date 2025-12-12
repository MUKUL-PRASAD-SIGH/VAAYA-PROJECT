// Authentication utility functions

export const getAuthToken = () => {
    return localStorage.getItem('token') || 'demo-token'
}

export const setAuthToken = (token) => {
    localStorage.setItem('token', token)
}

export const removeAuthToken = () => {
    localStorage.removeItem('token')
}

export const getUserData = () => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
        // Return demo user if not logged in
        return {
            _id: 'demo-user',
            email: 'demo@example.com',
            username: 'Demo User',
            name: 'Demo User',
            role: 'tourist',
            points: 0,
            completed_quests: 0,
        }
    }
    return JSON.parse(userStr)
}

export const setUserData = (user) => {
    localStorage.setItem('user', JSON.stringify(user))
}

export const removeUserData = () => {
    localStorage.removeItem('user')
}

export const isAuthenticated = () => {
    const token = getAuthToken()
    return token && token !== 'demo-token'
}

export const logout = () => {
    removeAuthToken()
    removeUserData()
    window.location.href = '/dashboard'
}
