import { useState, useEffect, useRef } from 'react'
import { chatApi } from '../../services/api'
import { io } from 'socket.io-client'
import {
    MessageSquare,
    Search,
    Send,
    Users,
    UserPlus,
    Check,
    CheckCheck,
    Smile,
    X,
    MapPin,
    Star,
    Globe
} from 'lucide-react'
import './CommunityTab.css'

// User connection types
const USER_TYPES = {
    FELLOW_TRAVELER: { label: 'Fellow Traveler', emoji: '🌍', color: '#22d3ee' },
    CULTURAL_GUEST: { label: 'Cultural Guest', emoji: '🎭', color: '#a855f7' },
    EXPERIENCE_BUDDY: { label: 'Experience Buddy', emoji: '🤝', color: '#22c55e' }
}

function CommunityTab() {
    const [connections, setConnections] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [nearbyTravelers, setNearbyTravelers] = useState([])
    const [showNearby, setShowNearby] = useState(false)
    const [onlineUsers, setOnlineUsers] = useState([])
    const messagesEndRef = useRef(null)
    const socketRef = useRef(null)

    useEffect(() => {
        // Initialize socket
        socketRef.current = io('http://localhost:5000')

        socketRef.current.on('connect', () => {
            console.log('Connected to community chat')
        })

        socketRef.current.on('new_message', (message) => {
            if (activeChat && message.conversation_id === activeChat._id) {
                setMessages(prev => [...prev, message])
            }
        })

        socketRef.current.on('user_online', (userId) => {
            setOnlineUsers(prev => [...prev, userId])
        })

        socketRef.current.on('user_offline', (userId) => {
            setOnlineUsers(prev => prev.filter(id => id !== userId))
        })

        loadConnections()
        loadNearbyTravelers()

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect()
            }
        }
    }, [])

    useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat._id)
            socketRef.current?.emit('join_room', { room: `chat_${activeChat._id}` })
        }
    }, [activeChat])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConnections = async () => {
        setLoading(true)
        try {
            const response = await chatApi.getConversations()
            // Filter to only show traveler-to-traveler connections
            const travelerChats = (response.data.conversations || [])
                .filter(c => c.participant.role === 'traveler')
            setConnections(travelerChats)
        } catch (error) {
            setConnections(getSampleConnections())
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (conversationId) => {
        try {
            const response = await chatApi.getMessages(conversationId)
            setMessages(response.data.messages || [])
        } catch (error) {
            setMessages(getSampleMessages())
        }
    }

    const loadNearbyTravelers = async () => {
        try {
            const response = await chatApi.getNearbyTravelers()
            setNearbyTravelers(response.data.travelers || [])
        } catch (error) {
            setNearbyTravelers(getSampleNearbyTravelers())
        }
    }

    const getSampleConnections = () => [
        {
            _id: 'c1',
            participant: {
                _id: 'u1',
                name: 'Sarah Wilson',
                avatar: null,
                role: 'traveler',
                location: 'Jaipur',
                badge: 'CULTURAL_GUEST'
            },
            lastMessage: {
                text: 'The cooking class was amazing! Thanks for the recommendation.',
                timestamp: new Date().toISOString(),
                read: true
            },
            unreadCount: 0
        },
        {
            _id: 'c2',
            participant: {
                _id: 'u2',
                name: 'Mike Chen',
                avatar: null,
                role: 'traveler',
                location: 'Chennai',
                badge: 'FELLOW_TRAVELER'
            },
            lastMessage: {
                text: 'Are you going to the temple festival tomorrow?',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                read: false
            },
            unreadCount: 1
        },
        {
            _id: 'c3',
            participant: {
                _id: 'u3',
                name: 'Emma Lee',
                avatar: null,
                role: 'traveler',
                location: 'Bangalore',
                badge: 'EXPERIENCE_BUDDY'
            },
            lastMessage: {
                text: 'Let\'s meet up at the street food tour!',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                read: true
            },
            unreadCount: 0
        }
    ]

    const getSampleNearbyTravelers = () => [
        { _id: 'n1', name: 'Alex Thompson', location: 'Nearby', distance: '0.5 km', badge: 'FELLOW_TRAVELER' },
        { _id: 'n2', name: 'Lisa Park', location: 'Nearby', distance: '1.2 km', badge: 'CULTURAL_GUEST' },
        { _id: 'n3', name: 'James Wilson', location: 'Nearby', distance: '2 km', badge: 'FELLOW_TRAVELER' }
    ]

    const getSampleMessages = () => [
        {
            _id: 'm1',
            sender_id: 'u1',
            text: 'Hey! I saw you completed the heritage walk quest.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: true
        },
        {
            _id: 'm2',
            sender_id: 'me',
            text: 'Yes! It was incredible. The old city has so much history.',
            timestamp: new Date(Date.now() - 3500000).toISOString(),
            read: true
        },
        {
            _id: 'm3',
            sender_id: 'u1',
            text: 'I\'m planning to do the cooking class tomorrow. Want to join?',
            timestamp: new Date(Date.now() - 3400000).toISOString(),
            read: true
        },
        {
            _id: 'm4',
            sender_id: 'me',
            text: 'Absolutely! What time?',
            timestamp: new Date(Date.now() - 3300000).toISOString(),
            read: true
        },
        {
            _id: 'm5',
            sender_id: 'u1',
            text: 'The cooking class was amazing! Thanks for the recommendation.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: true
        }
    ]

    const handleSendMessage = () => {
        if (!newMessage.trim() || !activeChat) return

        const message = {
            _id: `m_${Date.now()}`,
            sender_id: 'me',
            text: newMessage,
            timestamp: new Date().toISOString(),
            read: false
        }

        setMessages(prev => [...prev, message])

        socketRef.current?.emit('send_message', {
            room: `chat_${activeChat._id}`,
            message: newMessage,
            conversation_id: activeChat._id
        })

        setNewMessage('')
    }

    const handleConnect = async (traveler) => {
        try {
            await chatApi.startConversation({ user_id: traveler._id })
            loadConnections()
            setShowNearby(false)
        } catch (error) {
            console.error('Failed to connect:', error)
            // For demo, just add to connections
            const newConnection = {
                _id: `new_${traveler._id}`,
                participant: { ...traveler, role: 'traveler' },
                lastMessage: { text: 'Say hello!', timestamp: new Date().toISOString(), read: true },
                unreadCount: 0
            }
            setConnections(prev => [newConnection, ...prev])
            setActiveChat(newConnection)
            setShowNearby(false)
        }
    }

    const filteredConnections = connections.filter(c =>
        c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getBadge = (badgeType) => {
        const badge = USER_TYPES[badgeType] || USER_TYPES.FELLOW_TRAVELER
        return (
            <span className="user-badge" style={{ background: `${badge.color}20`, color: badge.color }}>
                {badge.emoji} {badge.label}
            </span>
        )
    }

    return (
        <div className="community-tab">
            {/* Sidebar - Connections */}
            <div className="connections-sidebar">
                <div className="sidebar-header">
                    <h3>Traveler Community</h3>
                    <button
                        className="nearby-btn"
                        onClick={() => setShowNearby(true)}
                    >
                        <Globe size={18} />
                        Find Nearby
                    </button>
                </div>

                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search travelers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="connections-list">
                    {loading ? (
                        <div className="loading-state">Loading...</div>
                    ) : filteredConnections.length === 0 ? (
                        <div className="empty-state">
                            <Users size={40} />
                            <p>No connections yet</p>
                            <button onClick={() => setShowNearby(true)}>
                                Find Travelers
                            </button>
                        </div>
                    ) : (
                        filteredConnections.map(conn => (
                            <div
                                key={conn._id}
                                className={`connection-item ${activeChat?._id === conn._id ? 'active' : ''} ${conn.unreadCount > 0 ? 'unread' : ''}`}
                                onClick={() => setActiveChat(conn)}
                            >
                                <div className="conn-avatar">
                                    <span>{conn.participant.name.charAt(0)}</span>
                                    {onlineUsers.includes(conn.participant._id) && (
                                        <span className="online-dot"></span>
                                    )}
                                </div>
                                <div className="conn-content">
                                    <div className="conn-header">
                                        <span className="conn-name">{conn.participant.name}</span>
                                        <span className="conn-time">{formatTime(conn.lastMessage.timestamp)}</span>
                                    </div>
                                    <div className="conn-location">
                                        <MapPin size={12} />
                                        {conn.participant.location}
                                    </div>
                                    <p className="conn-preview">{conn.lastMessage.text}</p>
                                    {conn.unreadCount > 0 && (
                                        <span className="unread-badge">{conn.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="user-avatar">
                                    {activeChat.participant.name.charAt(0)}
                                    {onlineUsers.includes(activeChat.participant._id) && (
                                        <span className="online-dot"></span>
                                    )}
                                </div>
                                <div className="user-details">
                                    <h4>{activeChat.participant.name}</h4>
                                    <div className="user-meta">
                                        <span className="location">
                                            <MapPin size={12} />
                                            {activeChat.participant.location}
                                        </span>
                                        {getBadge(activeChat.participant.badge)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.map(msg => (
                                <div
                                    key={msg._id}
                                    className={`message ${msg.sender_id === 'me' ? 'sent' : 'received'}`}
                                >
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                        <span className="message-time">
                                            {formatTime(msg.timestamp)}
                                            {msg.sender_id === 'me' && (
                                                msg.read ? <CheckCheck size={14} /> : <Check size={14} />
                                            )}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="message-input">
                            <button className="emoji-btn">
                                <Smile size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat">
                        <MessageSquare size={64} />
                        <h3>Connect with Fellow Travelers</h3>
                        <p>Chat with other travelers, share tips, and plan experiences together</p>
                        <button onClick={() => setShowNearby(true)}>
                            <UserPlus size={18} />
                            Find Travelers Nearby
                        </button>
                    </div>
                )}
            </div>

            {/* Nearby Travelers Modal */}
            {showNearby && (
                <div className="modal-overlay" onClick={() => setShowNearby(false)}>
                    <div className="nearby-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowNearby(false)}>
                            <X size={20} />
                        </button>
                        <h3>Travelers Nearby</h3>
                        <p>Connect with fellow travelers in your area</p>

                        <div className="nearby-list">
                            {nearbyTravelers.map(traveler => (
                                <div key={traveler._id} className="nearby-item">
                                    <div className="traveler-avatar">
                                        {traveler.name.charAt(0)}
                                    </div>
                                    <div className="traveler-info">
                                        <span className="traveler-name">{traveler.name}</span>
                                        <span className="traveler-distance">{traveler.distance} away</span>
                                        {getBadge(traveler.badge)}
                                    </div>
                                    <button
                                        className="connect-btn"
                                        onClick={() => handleConnect(traveler)}
                                    >
                                        <UserPlus size={16} />
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default CommunityTab
