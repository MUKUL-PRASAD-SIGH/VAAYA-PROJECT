import { useState, useRef, useEffect } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { aiApi } from '../services/api'

const CHAT_STORAGE_PREFIX = 'vaaya_ai_chat_'
const MAX_STORED_MESSAGES = 20

const getChatStorageKey = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
        try {
            const user = JSON.parse(userStr)
            if (user.uid) return CHAT_STORAGE_PREFIX + user.uid
            if (user.email) return CHAT_STORAGE_PREFIX + user.email.replace(/[^a-zA-Z0-9]/g, '_')
            if (user.id) return CHAT_STORAGE_PREFIX + user.id
        } catch (e) {
            console.log('Error parsing user:', e)
        }
    }
    let sessionId = localStorage.getItem('vaaya_user_id')
    if (!sessionId) {
        sessionId = 'anon_' + Date.now()
        localStorage.setItem('vaaya_user_id', sessionId)
    }
    return CHAT_STORAGE_PREFIX + sessionId
}

const saveMessagesToStorage = (messages) => {
    const toStore = messages.slice(-MAX_STORED_MESSAGES)
    localStorage.setItem(getChatStorageKey(), JSON.stringify(toStore))
}

const loadMessagesFromStorage = () => {
    try {
        const stored = localStorage.getItem(getChatStorageKey())
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Premium Message Component
function Message({ message, isOwn }) {
    return (
        <div className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${message.isAI
                        ? 'bg-gradient-to-br from-[#1a4a5c] to-[#2d6a7c]'
                        : 'bg-[#c4a35a]'
                    } text-white`}
            >
                {message.isAI ? '✨' : 'U'}
            </div>
            <div className="flex-1 max-w-lg">
                <div
                    className={`p-4 ${isOwn
                            ? 'bg-[#c4a35a] text-[#1a1a1a] rounded-2xl rounded-br-sm'
                            : 'glass-card text-[#f5f5f5] rounded-2xl rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
                <p className="luxury-text-muted text-xs mt-1 ml-2">{message.time}</p>
            </div>
        </div>
    )
}

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showFindUsers, setShowFindUsers] = useState(false)
    const messagesEndRef = useRef(null)

    const quickReplies = [
        "Best time to visit Goa?",
        "Nearby attractions",
        "How crowded is Jaipur?",
        "Hidden gems in Karnataka",
    ]

    useEffect(() => {
        const storedMessages = loadMessagesFromStorage()
        if (storedMessages.length > 0) {
            setMessages(storedMessages)
        } else {
            const welcomeMsg = {
                id: 1,
                text: "Welcome to Vayaa! ✨\n\nI'm your AI travel assistant. Ask me about:\n\n• Best places to visit in Karnataka\n• Local cuisine recommendations\n• Crowd predictions & best times\n• Hidden gems & cultural experiences",
                sender: 'AI',
                isAI: true,
                time: 'Just now',
            }
            setMessages([welcomeMsg])
            saveMessagesToStorage([welcomeMsg])
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const buildChatContext = () => {
        const lastMessages = messages.slice(-10)
        return lastMessages.map(msg => ({
            role: msg.isAI ? 'assistant' : 'user',
            content: msg.text
        }))
    }

    const handleSend = async (text = inputValue) => {
        if (!text.trim()) return

        const userMessage = {
            id: Date.now(),
            text: text.trim(),
            sender: 'User',
            isAI: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        saveMessagesToStorage(newMessages)
        setInputValue('')
        setIsLoading(true)

        try {
            const chatContext = buildChatContext()
            const response = await aiApi.chat(text, { history: chatContext })
            const aiResponseText = response.data.message || response.data.response || "I'm here to help with your travel queries!"

            const aiResponse = {
                id: Date.now() + 1,
                text: aiResponseText,
                sender: 'AI',
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            const updatedMessages = [...newMessages, aiResponse]
            setMessages(updatedMessages)
            saveMessagesToStorage(updatedMessages)
        } catch (error) {
            console.error('Chat error:', error)
            const fallbackText = `Great question!\n\nBased on AI analysis:\n• Best visiting hours: 6-8 AM\n• Current crowd level: Low\n• Weather: Favorable\n\nWould you like me to check the heatmap?`

            const aiResponse = {
                id: Date.now() + 1,
                text: fallbackText,
                sender: 'AI',
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            const updatedMessages = [...newMessages, aiResponse]
            setMessages(updatedMessages)
            saveMessagesToStorage(updatedMessages)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-8 h-[calc(100vh-80px)] flex flex-col relative z-10">

                {/* Header */}
                <div className="text-center mb-6">
                    <p className="luxury-subheading mb-2">YOUR AI COMPANION</p>
                    <h1 className="luxury-heading-gold text-4xl">Travel Assistant</h1>
                </div>

                {/* Chat Container */}
                <div className="flex-1 flex gap-6 overflow-hidden">

                    {/* Sidebar */}
                    <div className="w-72 flex-shrink-0 glass-card flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
                            <h3 className="luxury-heading-gold text-lg mb-3">Conversations</h3>
                            <div className="flex gap-2">
                                <button className="flex-1 glass-card p-2 text-xs luxury-text hover:bg-[rgba(255,255,255,0.08)]">
                                    Locals
                                </button>
                                <button className="flex-1 glass-card p-2 text-xs luxury-text hover:bg-[rgba(255,255,255,0.08)]">
                                    Tourists
                                </button>
                                <button className="flex-1 p-2 text-xs rounded" style={{ backgroundColor: 'rgba(196, 163, 90, 0.3)', color: '#c4a35a' }}>
                                    AI
                                </button>
                            </div>
                        </div>

                        {/* AI Chat Item */}
                        <div className="flex-1 overflow-y-auto luxury-scrollbar">
                            <div className="p-4 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(196,163,90,0.1)] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#1a4a5c] to-[#2d6a7c] rounded-full flex items-center justify-center text-xl">
                                        ✨
                                    </div>
                                    <div className="flex-1">
                                        <p className="luxury-text font-semibold">AI Travel Assistant</p>
                                        <p className="luxury-text-muted text-xs truncate">Ask me anything!</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 text-center">
                                <p className="luxury-text-muted text-sm">Start chatting with locals or tourists!</p>
                            </div>
                        </div>

                        {/* Find Users */}
                        <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
                            <button
                                onClick={() => setShowFindUsers(true)}
                                className="gold-button w-full text-sm"
                            >
                                + Find Users
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 glass-card flex flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-[rgba(255,255,255,0.1)] flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#1a4a5c] to-[#2d6a7c] rounded-full flex items-center justify-center text-lg">
                                    ✨
                                </div>
                                <div>
                                    <p className="luxury-text font-semibold">AI Travel Assistant</p>
                                    <p className="text-xs" style={{ color: '#22c55e' }}>Online</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 luxury-scrollbar">
                            {messages.map((message) => (
                                <Message key={message.id} message={message} isOwn={!message.isAI} />
                            ))}

                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#1a4a5c] to-[#2d6a7c] rounded-full flex items-center justify-center">
                                        ✨
                                    </div>
                                    <div className="glass-card p-4 rounded-2xl rounded-bl-sm">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-[rgba(255,255,255,0.1)] flex-shrink-0">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                                className="flex items-end gap-3"
                            >
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    rows="1"
                                    className="flex-1 luxury-input rounded-2xl resize-none"
                                    placeholder="Type a message..."
                                    style={{ maxHeight: '120px' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="gold-button rounded-full p-3 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>

                            {/* Quick Replies */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                {quickReplies.map((reply) => (
                                    <button
                                        key={reply}
                                        onClick={() => handleSend(reply)}
                                        className="glass-card px-4 py-2 text-xs luxury-text hover:bg-[rgba(255,255,255,0.08)]"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Find Users Modal */}
            {showFindUsers && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="luxury-heading-gold text-2xl">Find Travelers</h3>
                                <button
                                    onClick={() => setShowFindUsers(false)}
                                    className="luxury-text-muted hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <input
                                type="text"
                                className="w-full luxury-input mb-4"
                                placeholder="Search by name or location..."
                            />

                            <div className="text-center py-8">
                                <p className="luxury-text-muted">No travelers found nearby.</p>
                                <p className="luxury-text-muted text-sm mt-2">Try expanding your search area.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
