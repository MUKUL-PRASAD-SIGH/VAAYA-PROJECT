import { useState, useRef, useEffect } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { aiApi } from '../services/api'

// Message Component
function Message({ message, isOwn }) {
    return (
        <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${message.isAI
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}
            >
                {message.isAI ? 'AI' : 'U'}
            </div>
            <div className="flex-1">
                <div
                    className={`inline-block max-w-lg p-4 ${isOwn
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                        }`}
                >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-2">{message.time}</p>
            </div>
        </div>
    )
}

// Conversation Item
function ConversationItem({ conversation, isActive, onClick }) {
    return (
        <div
            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${isActive ? 'bg-purple-50' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl">
                    {conversation.isAI ? 'AI' : conversation.name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-800">{conversation.name}</p>
                    <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                </div>
            </div>
        </div>
    )
}

export default function Chat() {
    const [activeChat, setActiveChat] = useState('ai')
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi! I'm your AI travel assistant. Ask me about:\n• Best places to visit\n• Local recommendations\n• Crowd predictions\n• Travel tips and guides",
            sender: 'AI',
            isAI: true,
            time: 'Just now',
        },
    ])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showFindUsers, setShowFindUsers] = useState(false)
    const messagesEndRef = useRef(null)

    const conversations = [
        { id: 'ai', name: 'AI Travel Assistant', isAI: true, lastMessage: 'Ask me anything about travel!' },
    ]

    const quickReplies = [
        "What's the best time to visit Goa?",
        "Show me nearby attractions",
        "How crowded is Jaipur today?",
    ]

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (text = inputValue) => {
        if (!text.trim()) return

        const userMessage = {
            id: Date.now(),
            text: text.trim(),
            sender: 'User',
            isAI: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await aiApi.chat(text, {})

            const aiResponse = {
                id: Date.now() + 1,
                text: response.data.message || response.data.response || "I'm here to help with your travel queries!",
                sender: 'AI',
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            setMessages((prev) => [...prev, aiResponse])
        } catch (error) {
            console.error('Chat error:', error)

            // Demo response on error
            const aiResponse = {
                id: Date.now() + 1,
                text: `Great question!\n\nBased on AI analysis:\n\n- Best visiting hours: 6-8 AM\n- Current crowd level: Low\n- Weather: Favorable\n\nWould you like me to check the heatmap?`,
                sender: 'AI',
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }

            setMessages((prev) => [...prev, aiResponse])
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
        <div className="h-[calc(100vh-80px)] flex">
            <div className="container mx-auto px-4 py-6 flex gap-6 h-full">
                {/* Sidebar - Conversations List */}
                <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
                        <h3 className="text-xl font-bold text-white mb-4">Messages</h3>
                        <div className="flex space-x-2">
                            <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg transition text-sm font-semibold">
                                Locals
                            </button>
                            <button className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg transition text-sm font-semibold">
                                Tourists
                            </button>
                            <button className="flex-1 bg-white/30 text-white py-2 px-4 rounded-lg text-sm font-semibold">
                                AI
                            </button>
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isActive={activeChat === conv.id}
                                onClick={() => setActiveChat(conv.id)}
                            />
                        ))}
                        <div className="p-8 text-center text-gray-500">
                            <p>No recent conversations</p>
                            <p className="text-sm mt-2">Start chatting with locals or tourists!</p>
                        </div>
                    </div>

                    {/* Find Users */}
                    <div className="p-4 border-t">
                        <button
                            onClick={() => setShowFindUsers(true)}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition font-semibold"
                        >
                            + Find Users
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                                    AI
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">AI Travel Assistant</p>
                                    <p className="text-sm text-green-500">Online</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <Message key={message.id} message={message} isOwn={!message.isAI} />
                        ))}

                        {isLoading && (
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                                    AI
                                </div>
                                <div className="bg-gray-100 rounded-2xl rounded-bl-sm p-4">
                                    <LoadingSpinner size="sm" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                handleSend()
                            }}
                            className="flex items-end space-x-2"
                        >
                            <div className="flex-1">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    rows="1"
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                                    placeholder="Type a message..."
                                    style={{ maxHeight: '120px' }}
                                />
                            </div>
                            <button
                                type="button"
                                className="p-3 hover:bg-gray-200 rounded-full transition"
                                title="Attach file"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                            </button>
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm hover:bg-purple-200 transition"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Find Users Modal */}
            {showFindUsers && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Find Users to Chat</h3>
                                <button
                                    onClick={() => setShowFindUsers(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-4">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500"
                                    placeholder="Search by name or location..."
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-center text-gray-500 py-4">
                                    No users found nearby. Try expanding your search area.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
