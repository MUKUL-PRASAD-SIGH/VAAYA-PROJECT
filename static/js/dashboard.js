// Dashboard JavaScript
const API_BASE_URL = 'http://localhost:5000';

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token') || 'demo-token';
}

// Get user data
function getUserData() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // Return demo user if not logged in
        return {
            _id: 'demo-user',
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'tourist',
            points: 0,
            completed_quests: 0
        };
    }
    return JSON.parse(userStr);
}

// Check authentication (always returns true for demo)
function checkAuth() {
    return true;
}

// Initialize dashboard
async function initDashboard() {

    const user = getUserData();
    if (user) {
        document.getElementById('welcome-username').textContent = user.username || 'User';
        document.getElementById('username-display').textContent = user.username || 'User';

        // Update avatar
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=9333ea&color=fff`;
        }
    }

    // Load dashboard data
    await Promise.all([
        loadStats(),
        loadActiveQuests(),
        loadUpcomingTrips(),
        loadLeaderboard(),
        loadRecentActivity()
    ]);
}

// Load user stats
async function loadStats() {
    try {
        // Use demo stats since no authentication
        const demoStats = {
            total_points: 0,
            completed_quests: 0,
            trips_planned: 0,
            photos_shared: 0
        };

        document.getElementById('total-points').textContent = demoStats.total_points;
        document.getElementById('completed-quests').textContent = demoStats.completed_quests;
        document.getElementById('trips-planned').textContent = demoStats.trips_planned;
        document.getElementById('photos-shared').textContent = demoStats.photos_shared;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load active quests
async function loadActiveQuests() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/quests`);

        const questsList = document.getElementById('active-quests-list');
        const quests = response.data.quests || [];

        if (quests.length === 0) {
            questsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>Plan a trip to see sustainable quests!</p>
                    <a href="/trips" class="text-purple-600 hover:text-purple-800 mt-2 inline-block">Plan Trip</a>
                </div>
            `;
            return;
        }

        questsList.innerHTML = quests.slice(0, 3).map(quest => `
            <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition cursor-pointer" onclick="window.location.href='/quests'">
                <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-2xl">
                    🎯
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800">${quest.name || 'Quest'}</h4>
                    <p class="text-sm text-gray-500">${quest.location || 'Unknown location'}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-purple-600">${quest.points || 0} pts</p>
                    <p class="text-xs text-gray-500">${quest.difficulty || 'Medium'}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading quests:', error);
    }
}

// Load upcoming trips
async function loadUpcomingTrips() {
    try {
        // Demo: show empty state for now
        const tripsList = document.getElementById('upcoming-trips');
        tripsList.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>No trips planned yet</p>
                <a href="/trips" class="text-purple-600 hover:text-purple-800 mt-2 inline-block">Plan your first trip</a>
            </div>
        `;

    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        // Demo: show placeholder leaderboard
        const leaderboardContainer = document.getElementById('leaderboard-preview');
        if (leaderboardContainer) {
            leaderboardContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>Start completing quests to join the leaderboard!</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');

    // Mock activity data (replace with actual API call)
    const activities = [
        { type: 'quest', message: 'Completed "Visit Times Square"', time: '2 hours ago', icon: '✅' },
        { type: 'trip', message: 'Created trip to Paris', time: '5 hours ago', icon: '🗺️' },
        { type: 'points', message: 'Earned 50 points', time: '1 day ago', icon: '⭐' }
    ];

    activityContainer.innerHTML = activities.map(activity => `
        <div class="flex items-center space-x-3 p-3 border-l-2 border-gray-200">
            <span class="text-2xl">${activity.icon}</span>
            <div>
                <p class="text-gray-800">${activity.message}</p>
                <p class="text-xs text-gray-500">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

// Logout handler
document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
});

// User menu toggle
document.getElementById('user-menu-btn')?.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');

    if (userMenu && dropdown && !userMenu.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
