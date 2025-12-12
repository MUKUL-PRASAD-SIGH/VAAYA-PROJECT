// Heatmap JavaScript with Leaflet.js
const API_BASE_URL = 'http://localhost:5000';

function getAuthToken() {
    return localStorage.getItem('token');
}

let currentHeatmapData = null;
let map = null;
let heatLayer = null;
let questMarkers = [];

// Initialize Leaflet map
function initMap() {
    if (!map) {
        // Create map centered on India
        map = L.map('map').setView([20.5937, 78.9629], 5);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
        }).addTo(map);
    }
}

// Initialize map on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
});

// Generate heatmap
document.getElementById('generate-heatmap')?.addEventListener('click', async () => {
    const location = document.getElementById('location-input').value;
    const date = document.getElementById('date-input').value;
    const time = document.getElementById('time-input').value;

    if (!location || !date) {
        alert('Please enter location and date');
        return;
    }

    // Show loading
    document.getElementById('loading-overlay').classList.remove('hidden');

    try {
        // Fetch heatmap data
        const heatmapResponse = await axios.post(`${API_BASE_URL}/ai/heatmap`, {
            destination: location,
            date,
            time: time || '12:00'
        });

        currentHeatmapData = heatmapResponse.data;

        // Fetch quest locations
        const questsResponse = await axios.get(`${API_BASE_URL}/api/quests/locations?destination=${encodeURIComponent(location)}`);
        currentHeatmapData.quests = questsResponse.data.quests || [];

        // Render interactive map with heatmap
        renderInteractiveHeatmap(currentHeatmapData);

        // Update stats
        updateStats(currentHeatmapData);

        // Update last updated time
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

    } catch (error) {
        console.error('Error generating heatmap:', error);
        alert('Failed to generate heatmap. Please try again.');
    } finally {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
});

// Render interactive heatmap with Leaflet
function renderInteractiveHeatmap(data) {
    if (!map) {
        initMap();
    }

    // Remove existing heatmap layer
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }

    // Remove existing quest markers
    questMarkers.forEach(marker => map.removeLayer(marker));
    questMarkers = [];

    // Get heatmap data
    const heatmapData = data.heatmap || data.heatmap_data;
    const location = data.location || { lat: 20.5937, lng: 78.9629 };

    // Center map on location
    if (location.lat && location.lng) {
        map.setView([location.lat, location.lng], 13);
    }

    // Convert grid data to heatmap points
    const heatPoints = [];
    if (heatmapData && Array.isArray(heatmapData)) {
        const gridSize = heatmapData.length;
        const latOffset = 0.05; // Adjust spread
        const lngOffset = 0.05;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const intensity = heatmapData[i][j];
                const lat = location.lat + (i - gridSize / 2) * (latOffset / gridSize);
                const lng = location.lng + (j - gridSize / 2) * (lngOffset / gridSize);

                // Add point with intensity
                heatPoints.push([lat, lng, intensity]);
            }
        }
    }

    // Create heatmap layer
    if (heatPoints.length > 0) {
        heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: '#10b981',  // Green
                0.25: '#eab308', // Yellow
                0.5: '#f97316',  // Orange
                0.75: '#ef4444'  // Red
            }
        }).addTo(map);
    }

    // Add quest markers if available
    if (data.quests && Array.isArray(data.quests)) {
        data.quests.forEach(quest => {
            if (quest.location && quest.location.lat && quest.location.lng) {
                const marker = L.marker([quest.location.lat, quest.location.lng], {
                    icon: L.divIcon({
                        className: 'quest-marker',
                        html: `<div style="background: #9333ea; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold;">Q</div>`,
                        iconSize: [40, 40]
                    })
                }).addTo(map);

                marker.bindPopup(`
                    <div class="p-2">
                        <h3 class="font-bold text-purple-600">${quest.title || 'Quest'}</h3>
                        <p class="text-sm text-gray-600">${quest.description || ''}</p>
                        <p class="text-xs text-gray-500 mt-1">Points: ${quest.points || 0}</p>
                    </div>
                `);

                questMarkers.push(marker);
            }
        });
    }
}

// Get color for crowd density value
function getColorForValue(value) {
    // Value is between 0 and 1
    if (value < 0.25) {
        return '#10b981'; // Green - Low
    } else if (value < 0.5) {
        return '#eab308'; // Yellow - Medium
    } else if (value < 0.75) {
        return '#f97316'; // Orange - High
    } else {
        return '#ef4444'; // Red - Very High
    }
}

// Update stats
function updateStats(data) {
    if (!data.heatmap_data) return;

    const flatData = data.heatmap_data.flat();
    const avgDensity = flatData.reduce((a, b) => a + b, 0) / flatData.length;

    document.getElementById('avg-density').textContent = `${(avgDensity * 100).toFixed(0)}%`;

    // Find peak areas (values > 0.75)
    const peakCount = flatData.filter(v => v > 0.75).length;
    const totalCells = flatData.length;
    const peakPercentage = (peakCount / totalCells * 100).toFixed(0);

    document.getElementById('peak-areas').textContent = `${peakPercentage}% of area`;

    // Best time to visit
    const timeRecommendation = avgDensity < 0.3 ? 'Now is great!' :
        avgDensity < 0.6 ? 'Early morning or late evening' :
            'Visit during weekdays';
    document.getElementById('best-time').textContent = timeRecommendation;

    // Update AI insights
    updateAIInsights(data);
}

// Update AI insights
function updateAIInsights(data) {
    const insights = data.insights || [];
    const insightsContainer = document.getElementById('ai-insights');

    if (insights.length === 0) {
        insightsContainer.innerHTML = `
            <div class="space-y-2">
                <p class="text-sm">✨ Based on AI analysis:</p>
                <p class="text-sm">• Moderate crowd levels expected</p>
                <p class="text-sm">• Check weather conditions before visiting</p>
                <p class="text-sm">• Consider visiting during off-peak hours</p>
            </div>
        `;
    } else {
        insightsContainer.innerHTML = `
            <div class="space-y-2">
                <p class="text-sm font-semibold">✨ AI Recommendations:</p>
                ${insights.map(insight => `<p class="text-sm">• ${insight}</p>`).join('')}
            </div>
        `;
    }
}

// Set default date to today
document.getElementById('date-input').value = new Date().toISOString().split('T')[0];

// Canvas click handler for detailed info
document.getElementById('heatmap-canvas')?.addEventListener('click', (e) => {
    if (!currentHeatmapData) return;

    const canvas = document.getElementById('heatmap-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate grid position
    const gridSize = currentHeatmapData.heatmap_data.length;
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);

    if (gridX < gridSize && gridY < gridSize) {
        const value = currentHeatmapData.heatmap_data[gridY][gridX];
        const percentage = (value * 100).toFixed(0);

        alert(`Grid Position: (${gridX}, ${gridY})\nCrowd Density: ${percentage}%\n\n${getCrowdLevelText(value)}`);
    }
});

function getCrowdLevelText(value) {
    if (value < 0.25) return '🟢 Low crowd levels - Great time to visit!';
    if (value < 0.5) return '🟡 Moderate crowds - Still a good time';
    if (value < 0.75) return '🟠 High crowd levels - Expect queues';
    return '🔴 Very crowded - Consider visiting later';
}

// Initialize with sample data
document.addEventListener('DOMContentLoaded', () => {
    // Set location input to current location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            // You could reverse geocode here to get location name
            console.log('Current position:', position.coords);
        });
    }
});
