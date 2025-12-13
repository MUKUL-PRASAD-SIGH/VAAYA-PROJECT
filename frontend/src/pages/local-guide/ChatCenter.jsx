import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../../services/api'
import { io } from 'socket.io-client'
import { useLanguage } from '../../context/LanguageContext'
import './ChatCenter.css'

function ChatCenter() {
    const { t } = useLanguage()
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [connected, setConnected] = useState(false)
    const [pendingRequests, setPendingRequests] = useState([])
    const [nearbyTravelers, setNearbyTravelers] = useState([])
    const [activeTab, setActiveTab] = useState('requests') // 'requests', 'travelers', 'messages'
    const [userLocation, setUserLocation] = useState(null)
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

    // Get or create consistent local guide ID
    const getLocalGuideId = () => {
        let id = localStorage.getItem('localGuideId')
        if (!id) {
            id = 'local_' + Date.now()
            localStorage.setItem('localGuideId', id)
        }
        return id
    }

    // Get location and update on server
    useEffect(() => {
        const localId = getLocalGuideId()

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    setUserLocation(loc)

                    // Update location as local guide
                    chatApi.updateLocation({
                        user_id: localId,
                        lat: loc.lat,
                        lng: loc.lng,
                        name: localStorage.getItem('userName') || 'Local Guide',
                        role: 'local'
                    }).catch(console.error)
                },
                () => setUserLocation({ lat: 12.9716, lng: 77.5946 })
            )
        }

        // Update location every 30 seconds
        const interval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    chatApi.updateLocation({
                        user_id: localId,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        name: localStorage.getItem('userName') || 'Local Guide',
                        role: 'local'
                    }).catch(console.error)
                })
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    // Load pending requests
    const loadPendingRequests = async () => {
        try {
            const localId = getLocalGuideId()
            const response = await chatApi.getPendingRequests(localId)
            setPendingRequests(response.data.requests || [])
        } catch (error) {
            console.error('Failed to load pending requests:', error)
        }
    }

    // Load nearby travelers
    const loadNearbyTravelers = async () => {
        if (!userLocation) return
        try {
            const response = await chatApi.getNearbyTravelersForLocal(
                userLocation.lat, userLocation.lng, 20
            )
            setNearbyTravelers(response.data.travelers || [])
        } catch (error) {
            console.error('Failed to load nearby travelers:', error)
        }
    }

    // Initially load requests
    useEffect(() => {
        loadPendingRequests()
        const interval = setInterval(loadPendingRequests, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    // Load travelers when tab or location changes
    useEffect(() => {
        if (activeTab === 'travelers' && userLocation) {
            loadNearbyTravelers()
        }
    }, [activeTab, userLocation])

    // Handle approve/reject
    const handleRespond = async (requestId, action) => {
        try {
            await chatApi.respondToRequest(requestId, action)
            loadPendingRequests() // Refresh list
            if (action === 'approve') {
                loadConversations() // Refresh conversations if approved
            }
            alert(`✅ Request ${action}d successfully!`)
        } catch (error) {
            console.error('Failed to respond:', error)
            alert(`❌ Failed to ${action} request`)
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
                    <h3>{t('messages')}</h3>
                    <span className="message-count">{pendingRequests.length}</span>
                </div>

                {/* Tab Buttons */}
                <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{
                            flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'requests' ? 'rgba(196,163,90,0.3)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === 'requests' ? '#c4a35a' : '#888'
                        }}
                    >
                        Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                    </button>
                    <button
                        onClick={() => setActiveTab('travelers')}
                        style={{
                            flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'travelers' ? 'rgba(196,163,90,0.3)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === 'travelers' ? '#c4a35a' : '#888'
                        }}
                    >
                        Nearby
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        style={{
                            flex: 1, padding: '8px', fontSize: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                            background: activeTab === 'messages' ? 'rgba(196,163,90,0.3)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === 'messages' ? '#c4a35a' : '#888'
                        }}
                    >
                        Chats
                    </button>
                </div>

                {/* Pending Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="conversations-list">
                        {pendingRequests.length > 0 ? pendingRequests.map(req => (
                            <div key={req._id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #c4a35a, #a08030)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        🧳
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: '#fff', fontWeight: '600', margin: 0 }}>{req.from_name}</p>
                                        <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>{req.message}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => handleRespond(req._id, 'approve')}
                                        style={{ flex: 1, padding: '8px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => handleRespond(req._id, 'reject')}
                                        style={{ flex: 1, padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                <p>No pending requests</p>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>Travelers can find you and request to chat</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Nearby Travelers Tab */}
                {activeTab === 'travelers' && (
                    <div className="conversations-list">
                        {nearbyTravelers.length > 0 ? nearbyTravelers.map(traveler => (
                            <div key={traveler._id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #c4a35a, #a08030)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            🧳
                                        </div>
                                        {traveler.is_online && (
                                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', border: '2px solid #1a1a2e' }}></div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: '#fff', fontWeight: '600', margin: 0 }}>{traveler.name}</p>
                                        <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0 0' }}>{traveler.distance} away</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                <p>No travelers nearby</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Messages/Conversations Tab */}
                {activeTab === 'messages' && (
                    <>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder={t('searchConversations')}
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
                    </>
                )}
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
                            <button className="input-action" title={t('attachFile')}>+</button>
                            <input
                                type="text"
                                placeholder={t('typeAMessage')}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button className="send-btn" onClick={handleSendMessage}>
                                {t('sendMessage')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>{t('selectConversation')}</p>
                    </div>
                )}
            </div>

            {/* Quick Responses Panel */}
            <div className="quick-responses-panel">
                <h4>{t('quickResponses')}</h4>
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

                <h4>{t('travelTips')}</h4>
                <div className="tips-list">
                    <div className="tip-item">
                        <p>{t('bestVisitingHours')}</p>
                    </div>
                    <div className="tip-item">
                        <p>{t('localRestaurantsClose')}</p>
                    </div>
                    <div className="tip-item">
                        <p>{t('bookCabsAdvance')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatCenter
