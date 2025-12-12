import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!currentUser) {
        // Redirect to login page, but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Allow access to role-selection even if not verified (for legacy support)
    const isRoleSelection = location.pathname === '/role-selection'

    if (!currentUser.emailVerified && !isRoleSelection) {
        return <Navigate to="/verify-email" replace />
    }

    return children
}
