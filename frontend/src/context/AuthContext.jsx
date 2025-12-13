import { createContext, useContext, useState, useEffect } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    sendEmailVerification,
    RecaptchaVerifier,
    linkWithPhoneNumber
} from 'firebase/auth'
import { auth, googleProvider } from '../firebaseConfig'
import { userApi } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Sign up with email and password
    async function signup(email, password, displayName = '') {
        try {
            setError(null)
            const result = await createUserWithEmailAndPassword(auth, email, password)

            // Update display name if provided
            if (displayName) {
                await updateProfile(result.user, { displayName })
            }

            return result.user
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Sign in with email and password
    async function login(email, password) {
        try {
            setError(null)
            const result = await signInWithEmailAndPassword(auth, email, password)
            return result.user
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Sign in with Google
    async function loginWithGoogle() {
        try {
            setError(null)
            const result = await signInWithPopup(auth, googleProvider)
            return result.user
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Sign out
    async function logout() {
        try {
            setError(null)
            await signOut(auth)
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Reset password
    async function resetPassword(email) {
        try {
            setError(null)
            await sendPasswordResetEmail(auth, email)
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Send verification email
    async function sendVerificationEmail() {
        try {
            setError(null)
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser)
            }
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Reload user to check verification status
    async function reloadUser() {
        try {
            if (auth.currentUser) {
                await auth.currentUser.reload()
                setCurrentUser({ ...auth.currentUser })
                return auth.currentUser
            }
        } catch (err) {
            console.error('Failed to reload user', err)
            throw err
        }
    }

    // Setup Recaptcha
    function setupRecaptcha(elementId) {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            })
        }
        return window.recaptchaVerifier
    }

    // Link Phone Number
    async function linkPhone(phoneNumber, appVerifier) {
        try {
            setError(null)
            if (auth.currentUser) {
                return await linkWithPhoneNumber(auth.currentUser, phoneNumber, appVerifier)
            }
        } catch (err) {
            setError(getErrorMessage(err.code))
            throw err
        }
    }

    // Convert Firebase error codes to user-friendly messages
    function getErrorMessage(code) {
        switch (code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please login instead.'
            case 'auth/invalid-email':
                return 'Please enter a valid email address.'
            case 'auth/operation-not-allowed':
                return 'This sign-in method is not enabled.'
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.'
            case 'auth/user-disabled':
                return 'This account has been disabled.'
            case 'auth/user-not-found':
                return 'No account found with this email.'
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.'
            case 'auth/invalid-credential':
                return 'Invalid email or password.'
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.'
            case 'auth/popup-closed-by-user':
                return 'Sign-in popup was closed.'
            default:
                return 'An error occurred. Please try again.'
        }
    }

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user)
            setLoading(false)

            if (user) {
                // Get token and save to localStorage for API calls
                try {
                    const token = await user.getIdToken()
                    localStorage.setItem('firebase_token', token)
                    localStorage.setItem('user', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    }))

                    // Sync with backend to get Backend JWT
                    try {
                        const backendResponse = await userApi.getMe()
                        if (backendResponse.data.token) {
                            localStorage.setItem('token', backendResponse.data.token)
                            console.log("Backend token synced")
                        }
                    } catch (backendErr) {
                        console.warn("Backend sync failed (user might need onboarding):", backendErr)
                    }
                } catch (e) {
                    console.error('Failed to get token', e)
                }
            } else {
                localStorage.removeItem('token')
                localStorage.removeItem('firebase_token')
                localStorage.removeItem('user')
            }
        })

        return unsubscribe
    }, [])

    const value = {
        currentUser,
        loading,
        error,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        sendVerificationEmail,
        setupRecaptcha,
        linkPhone,
        reloadUser,
        clearError: () => setError(null)
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
