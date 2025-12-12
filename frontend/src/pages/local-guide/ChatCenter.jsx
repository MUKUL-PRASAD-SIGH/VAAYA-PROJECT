import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../../services/api'
import { io } from 'socket.io-client'
import './ChatCenter.css'

function ChatCenter() {
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [connected, setConnected] = useState(false)
    const messagesEndRef = useRef(null)
    const socketRef = useRef(null)

    // Initialize socket connection
    useEffect(() => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
        socketRef.current = io(apiBaseUrl)

        socketRef.current.on('connect', () => {
            setConnected(true)
            console.log('Socket connected')
        })

        socketRef.current.on('disconnect', () => {
            setConnected(false)
        })

        socketRef.current.on('new_message', (data) => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: 'other',
                text: data.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }])
        })

        loadConversations()

        return () => {
            socketRef.current?.disconnect()
        }
    }, [])

    const loadConversations = async () => {
        try {
            setLoading(true)
            const response = await chatApi.getConversations()
            const convos = response.data.conversations || []
            setConversations(convos.length > 0 ? convos : [
                { id: 1, name: 'Welcome', lastMessage: 'Welcome to Chat!', time: 'Now', unread: 0, online: true }
            ])
        } catch (error) {
            console.error('Failed to load conversations:', error)
            setConversations([
                { id: 1, name: 'Support Team', lastMessage: 'How can we help?', time: 'Now', unread: 0, online: true, isSupport: true }
            ])
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (selectedConversation && socketRef.current) {
            const roomId = `chat_${selectedConversation.id}`
            socketRef.current.emit('join', { room: roomId, username: 'Local Guide' })
        }
    }, [selectedConversation])

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return

        const message = {
            id: Date.now(),
            sender: 'me',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        if (socketRef.current && connected) {
            socketRef.current.emit('send_message', {
                room: `chat_${selectedConversation.id}`,
                message: newMessage,
                username: 'Local Guide',
                type: 'text'
            })
        }

        setMessages([...messages, message])
        setNewMessage('')
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleQuickResponse = (text) => {
        setNewMessage(text)
    }

    const filteredConversations = conversations.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="chat-center">
            {/* Conversations List */}
            <div className="conversations-panel">
                <div className="panel-header">
                    <h3>Messages</h3>
                    <span className="message-count">{conversations.reduce((acc, c) => acc + c.unread, 0)}</span>
                </div>

                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="conversations-list">
                    {filteredConversations.map(conversation => (
                        <div
                            key={conversation.id}
                            className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.isSupport ? 'support' : ''}`}
                            onClick={() => setSelectedConversation(conversation)}
                        >
                            <div className="conversation-avatar">
                                <span className="avatar-letter">{conversation.name[0]}</span>
                                {conversation.online && <span className="online-dot"></span>}
                            </div>
                            <div className="conversation-info">
                                <div className="conversation-header">
                                    <h4>{conversation.name}</h4>
                                    <span className="conversation-time">{conversation.time}</span>
                                </div>
                                <p className="conversation-preview">{conversation.lastMessage}</p>
                            </div>
                            {conversation.unread > 0 && (
                                <span className="unread-badge">{conversation.unread}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="chat-window">
                {selectedConversation ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user">
                                <div className="user-avatar">
                                    <span className="avatar-letter">{selectedConversation.name[0]}</span>
                                    {selectedConversation.online && <span className="online-dot"></span>}
                                </div>
                                <div className="user-info">
                                    <h4>{selectedConversation.name}</h4>
                                    <span className={`user-status ${selectedConversation.online ? 'online' : 'offline'}`}>
                                        {selectedConversation.online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <button className="action-btn" title="Voice Call">Call</button>
                                <button className="action-btn" title="Video Call">Video</button>
                                <button className="action-btn" title="More Options">More</button>
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
                                >
                                    <div className="message-bubble">
                                        <p>{message.text}</p>
                                        <span className="message-time">{message.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="message-input-container">
                            <button className="input-action" title="Attach File">+</button>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button className="send-btn" onClick={handleSendMessage}>
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>

            {/* Quick Responses Panel */}
            <div className="quick-responses-panel">
                <h4>Quick Responses</h4>
                <div className="quick-responses">
                    <button className="quick-response" onClick={() => handleQuickResponse("Hello! How can I help you today?")}>
                        Hello! How can I help you today?
                    </button>
                    <button className="quick-response" onClick={() => handleQuickResponse("Can you share your current location?")}>
                        Can you share your current location?
                    </button>
                    <button className="quick-response" onClick={() => handleQuickResponse("The best time to visit is early morning.")}>
                        The best time to visit is early morning.
                    </button>
                    <button className="quick-response" onClick={() => handleQuickResponse("I recommend checking out my quests!")}>
                        I recommend checking out my quests!
                    </button>
                    <button className="quick-response" onClick={() => handleQuickResponse("Thank you for your feedback!")}>
                        Thank you for your feedback!
                    </button>
                </div>

                <h4>Travel Tips</h4>
                <div className="tips-list">
                    <div className="tip-item">
                        <p>Best visiting hours: 9 AM - 11 AM</p>
                    </div>
                    <div className="tip-item">
                        <p>Local restaurants close by 10 PM</p>
                    </div>
                    <div className="tip-item">
                        <p>Book cabs in advance for tourist spots</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatCenter
