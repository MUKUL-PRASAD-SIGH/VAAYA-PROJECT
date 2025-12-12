import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AccentColorProvider } from './context/AccentColorContext'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import Quests from './pages/Quests'
import Heatmap from './pages/Heatmap'
import Chat from './pages/Chat'
import { Profile, Settings, Personalisation } from './pages/user'
import { Login, Register, ForgotPassword, VerifyEmail } from './pages/auth'
import RoleSelection from './pages/RoleSelection'
import Onboarding from './pages/Onboarding'

function AppContent() {
    const { themeColors, getThemeStyles } = useTheme()

    return (
        <div className="min-h-screen" style={getThemeStyles.pageBackground}>
            <Navbar />
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/trips" element={
                    <ProtectedRoute>
                        <Trips />
                    </ProtectedRoute>
                } />
                <Route path="/quests" element={
                    <ProtectedRoute>
                        <Quests />
                    </ProtectedRoute>
                } />
                <Route path="/heatmap" element={
                    <ProtectedRoute>
                        <Heatmap />
                    </ProtectedRoute>
                } />
                <Route path="/chat" element={
                    <ProtectedRoute>
                        <Chat />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } />
                <Route path="/personalisation" element={
                    <ProtectedRoute>
                        <Personalisation />
                    </ProtectedRoute>
                } />
                <Route path="/role-selection" element={
                    <ProtectedRoute>
                        <RoleSelection />
                    </ProtectedRoute>
                } />
                <Route path="/onboarding" element={
                    <ProtectedRoute>
                        <Onboarding />
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AccentColorProvider>
                    <AppContent />
                </AccentColorProvider>
            </ThemeProvider>
        </AuthProvider>
    )
}

export default App

