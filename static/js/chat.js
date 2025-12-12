// Chat JavaScript
const API_BASE_URL = 'http://localhost:5000';

function getAuthToken() {
    return localStorage.getItem('token');
}

function getUserData() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

let currentChatType = 'ai';
let currentChatId = 'ai-assistant';
let currentChatName = 'AI Travel Assistant';

// AI Chat Handler
document.getElementById('message-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    // Clear input
    messageInput.value = '';

    // Add user message to chat
    addMessageToChat(message, 'sent');

    if (currentChatType === 'ai') {
        // Show typing indicator
        showTypingIndicator();

        try {
            const token = getAuthToken();
            const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
                message,
                context: {
                    user_location: 'Current location',
                    previous_messages: []
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove typing indicator
            removeTypingIndicator();

            // Add AI response
            const aiResponse = response.data.message || response.data.response || 'Sorry, I could not get a response.';
            addMessageToChat(aiResponse, 'received');

        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'received');
        }
    } else {
        // Handle regular user chat (WebSocket implementation would go here)
        addMessageToChat('User-to-user chat coming soon!', 'received');
    }
});

// Add message to chat
function addMessageToChat(message, type) {
    const container = document.getElementById('messages-container');
    const user = getUserData();

    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start space-x-3 ${type === 'sent' ? 'flex-row-reverse space-x-reverse' : ''}`;

    const avatar = type === 'sent'
        ? `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'You')}&background=9333ea&color=fff" class="w-8 h-8 rounded-full flex-shrink-0">`
        : `<div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>`;

    messageDiv.innerHTML = `
        ${avatar}
        <div class="flex-1 ${type === 'sent' ? 'text-right' : ''}">
            <div class="${type === 'sent' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl ${type === 'sent' ? 'rounded-tr-none' : 'rounded-tl-none'} p-4 inline-block max-w-lg">
                <p class="whitespace-pre-wrap">${message}</p>
            </div>
            <p class="text-xs text-gray-500 mt-1 ${type === 'sent' ? 'mr-2' : 'ml-2'}">Just now</p>
        </div>
    `;

    container.appendChild(messageDiv);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const container = document.getElementById('messages-container');

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex items-start space-x-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
            🤖
        </div>
        <div class="bg-gray-100 rounded-2xl rounded-tl-none p-4 inline-block">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Quick reply buttons
document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const message = btn.textContent.trim();
        document.getElementById('message-input').value = message;
        document.getElementById('message-form').dispatchEvent(new Event('submit'));
    });
});

// Auto-resize textarea
document.getElementById('message-input')?.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
});

// Switch chat tabs
document.getElementById('show-locals')?.addEventListener('click', () => {
    switchChatType('locals');
});

document.getElementById('show-tourists')?.addEventListener('click', () => {
    switchChatType('tourists');
});

document.getElementById('show-ai')?.addEventListener('click', () => {
    switchChatType('ai');
});

function switchChatType(type) {
    currentChatType = type;

    // Update tab UI
    document.querySelectorAll('#show-locals, #show-tourists, #show-ai').forEach(btn => {
        btn.classList.remove('bg-white/30');
        btn.classList.add('bg-white/20');
    });

    document.getElementById(`show-${type}`).classList.remove('bg-white/20');
    document.getElementById(`show-${type}`).classList.add('bg-white/30');

    if (type === 'ai') {
        // Show AI chat
        currentChatId = 'ai-assistant';
        currentChatName = 'AI Travel Assistant';
        loadAIChat();
    } else {
        // Load user chats
        loadUserChats(type);
    }
}

// Load AI chat
function loadAIChat() {
    document.getElementById('chat-name').textContent = 'AI Travel Assistant';
    document.getElementById('chat-status').textContent = 'Online';
    document.getElementById('quick-replies').classList.remove('hidden');

    // Clear and show welcome message
    const container = document.getElementById('messages-container');
    container.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                🤖
            </div>
            <div class="flex-1">
                <div class="bg-gray-100 rounded-2xl rounded-tl-none p-4 inline-block max-w-lg">
                    <p class="text-gray-800">Hi! I'm your AI travel assistant. Ask me about:</p>
                    <ul class="mt-2 space-y-1 text-sm">
                        <li>• Best places to visit</li>
                        <li>• Local recommendations</li>
                        <li>• Crowd predictions</li>
                        <li>• Travel tips and guides</li>
                    </ul>
                </div>
                <p class="text-xs text-gray-500 mt-1 ml-2">Just now</p>
            </div>
        </div>
    `;
}

// Load user chats
async function loadUserChats(type) {
    document.getElementById('quick-replies').classList.add('hidden');

    try {
        const token = getAuthToken();
        // In a real app, this would fetch actual chat conversations
        const response = await axios.get(`${API_BASE_URL}/api/chat/conversations?type=${type}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // For now, show placeholder
        const container = document.getElementById('messages-container');
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                    <p class="text-lg mb-2">No ${type} conversations yet</p>
                    <p class="text-sm">Start chatting with ${type} to see messages here</p>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Find users modal
document.getElementById('find-users-btn')?.addEventListener('click', () => {
    document.getElementById('find-users-modal').classList.remove('hidden');
    loadAvailableUsers();
});

document.getElementById('close-find-users')?.addEventListener('click', () => {
    document.getElementById('find-users-modal').classList.add('hidden');
});

// Load available users
async function loadAvailableUsers() {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/api/users/nearby?limit=20`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const usersList = document.getElementById('users-list');
        const users = response.data.users || [];

        if (users.length === 0) {
            usersList.innerHTML = '<p class="text-center text-gray-500">No users found</p>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-center space-x-3">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}" class="w-12 h-12 rounded-full">
                    <div>
                        <p class="font-semibold text-gray-800">${user.username}</p>
                        <p class="text-sm text-gray-500">${user.role || 'Tourist'} • ${user.location || 'Unknown'}</p>
                    </div>
                </div>
                <button onclick="startChat('${user._id}', '${user.username}')" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    Chat
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Start chat with user
function startChat(userId, username) {
    currentChatType = 'user';
    currentChatId = userId;
    currentChatName = username;

    document.getElementById('chat-name').textContent = username;
    document.getElementById('chat-status').textContent = 'Online';
    document.getElementById('find-users-modal').classList.add('hidden');

    // Load chat messages
    const container = document.getElementById('messages-container');
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center text-gray-500">
                <p class="text-lg mb-2">Start a conversation with ${username}</p>
                <p class="text-sm">Send a message to begin chatting</p>
            </div>
        </div>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAIChat();
});
