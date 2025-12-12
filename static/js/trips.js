// Trips JavaScript
const API_BASE_URL = 'http://localhost:5000';

function getAuthToken() {
    return localStorage.getItem('token');
}

// Create Trip Form Handler
document.getElementById('trip-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const destination = document.getElementById('destination').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const budget = document.getElementById('budget').value;
    const purpose = document.getElementById('purpose').value;

    // Show loading modal
    document.getElementById('loading-modal').classList.remove('hidden');

    try {
        const token = getAuthToken();
        // Default to India coordinates (New Delhi center)
        const response = await axios.post(`${API_BASE_URL}/api/trips/create`, {
            destination,
            start_date: startDate,
            end_date: endDate,
            location_coords: { lat: 28.6139, lng: 77.2090 }, // Default India coords
            country_code: 'IN',  // Always India
            preferences: {
                budget: budget,
                purpose: purpose,
                interests: [purpose]  // Use purpose as main interest
            }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const trip = response.data.trip;

        // Display trip results
        displayTripResults(trip);

        // Load sustainable quests for this trip
        await loadQuestsForTrip(trip._id || trip.id);

        // Generate AI itinerary
        await generateItinerary(trip);

        // Reload trips list
        await loadMyTrips();

    } catch (error) {
        console.error('Error creating trip:', error);
        const errorMsg = error.response?.data?.error || 'Failed to create trip. Please try again.';
        alert(errorMsg);
    } finally {
        document.getElementById('loading-modal').classList.add('hidden');
    }
});

// Display trip results
function displayTripResults(trip) {
    const resultsSection = document.getElementById('trip-results');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Generate crowd calendar chart using Plotly
    generateCrowdCalendar(trip.destination, trip.start_date, trip.end_date);

    // Keep old predictions for backward compatibility (hidden)
    const predictionsContainer = document.getElementById('crowd-predictions');
    if (predictionsContainer) {
        const predictions = trip.daily_predictions || [];

        predictionsContainer.innerHTML = predictions.map(pred => {
            const crowdClass = `crowd-${pred.crowd_level.replace('_', '-')}`;
            const crowdEmoji = getCrowdEmoji(pred.crowd_level);
            const crowdPercent = (pred.crowd_score * 100).toFixed(0);

            // Color coding based on crowd level
            let bgColor = 'bg-green-50 border-green-300';
            let textColor = 'text-green-800';
            if (pred.crowd_level === 'very_high' || pred.crowd_level === 'high') {
                bgColor = 'bg-red-50 border-red-300';
                textColor = 'text-red-800';
            } else if (pred.crowd_level === 'medium') {
                bgColor = 'bg-yellow-50 border-yellow-300';
                textColor = 'text-yellow-800';
            }

            return `
            <div class="p-5 rounded-xl border-2 ${bgColor} shadow-sm hover:shadow-md transition">
                <div class="text-center mb-3">
                    <span class="text-4xl">${crowdEmoji}</span>
                </div>
                <p class="font-bold text-center mb-3 text-gray-800">${new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between items-center">
                        <span class="${textColor} font-semibold">${pred.crowd_level.replace('_', ' ').toUpperCase()}</span>
                        <span class="${textColor} font-bold text-lg">${crowdPercent}%</span>
                    </div>
                    ${pred.weather_info ? `
                    <div class="pt-2 border-t border-gray-200">
                        <p class="text-gray-600 flex items-center gap-2">
                            <span>🌡️</span>
                            <span>${Math.round(pred.weather_info.temp?.avg || 20)}°C</span>
                        </p>
                        <p class="text-gray-500 text-xs mt-1">${pred.weather_info.description || pred.weather_info.weather || 'Pleasant'}</p>
                    </div>` : ''}
                    ${pred.is_holiday ? '<p class="text-red-600 font-semibold flex items-center gap-1 mt-2"><span>🎉</span> Holiday</p>' : ''}
                    ${pred.has_festival ? '<p class="text-purple-600 font-semibold flex items-center gap-1"><span>🎊</span> Festival</p>' : ''}
                    ${pred.is_vacation_season ? '<p class="text-blue-600 flex items-center gap-1"><span>☀️</span> Vacation</p>' : ''}
                </div>
            </div>
        `;
        }).join('');

        // Display weather forecast if available
        if (predictions.length > 0 && predictions[0].weather_info) {
            displayWeatherForecast(predictions);
        }
    }
}

// Display weather forecast
function displayWeatherForecast(predictions) {
    const forecastContainer = document.getElementById('weather-forecast');

    forecastContainer.innerHTML = predictions.map(pred => {
        if (!pred.weather_info) return '';

        const weather = pred.weather_info;
        const temp = weather.temp?.avg || weather.temp || weather.temperature || 20;
        const desc = weather.description || weather.weather || 'Partly Cloudy';
        const weatherEmoji = getWeatherEmoji(desc);
        const minTemp = Math.round(weather.temp?.min || temp - 3);
        const maxTemp = Math.round(weather.temp?.max || temp + 3);

        return `
            <div class="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
                <p class="text-xs font-semibold mb-2 opacity-90">${new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <span class="text-5xl block mb-3">${weatherEmoji}</span>
                <div class="space-y-1">
                    <p class="font-bold text-2xl">${Math.round(temp)}°C</p>
                    <p class="text-xs opacity-75">${minTemp}° / ${maxTemp}°</p>
                    <p class="text-xs mt-2 leading-tight">${desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Get user's origin location (default: Bengaluru)
function getUserOrigin() {
    // TODO: Get from user profile when login is implemented
    // For now, default to Bengaluru, India
    return localStorage.getItem('user_origin') || 'Bengaluru';
}

// Generate AI itinerary
async function generateItinerary(trip) {
    try {
        const token = getAuthToken();
        const userOrigin = getUserOrigin();

        const response = await axios.post(`${API_BASE_URL}/ai/generate-itinerary`, {
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
            origin: userOrigin,  // User's home city (default: Bengaluru)
            preferences: trip.preferences || {}
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data;
        const itinerary = data.itinerary;
        const itineraryContainer = document.getElementById('ai-itinerary');

        // Format itinerary with markdown-style formatting
        if (itinerary && itinerary !== 'null' && itinerary.trim() !== '') {
            itineraryContainer.innerHTML = `<div class="whitespace-pre-wrap">${itinerary}</div>`;
        } else {
            itineraryContainer.innerHTML = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <p class="text-yellow-800"><strong>⚠️ AI Itinerary temporarily unavailable</strong></p>
                    <p class="text-yellow-700 text-sm mt-2">Please check the transportation and hotel options below to plan your trip.</p>
                </div>
            `;
        }

        // Display transportation and hotels
        if (data.transportation || data.hotels) {
            displayTransportationAndHotels(data.transportation, data.hotels, trip.destination);
        } else {
            console.warn('No transportation or hotels data received');
        }

    } catch (error) {
        console.error('Error generating itinerary:', error);
        document.getElementById('ai-itinerary').innerHTML =
            '<p class="text-gray-500">Failed to generate itinerary. Please try again.</p>';
    }
}

// Display transportation and hotels
function displayTransportationAndHotels(transportation, hotels, destination) {
    console.log('displayTransportationAndHotels called with:', { transportation, hotels, destination });

    const section = document.getElementById('transportation-section');
    if (!section) {
        console.error('transportation-section element not found!');
        return;
    }

    section.classList.remove('hidden');

    const userOrigin = getUserOrigin();

    // Display flights
    const flightsList = document.getElementById('flights-list');
    if (transportation && transportation.flights && transportation.flights.length > 0) {
        flightsList.innerHTML = transportation.flights.map(flight => `
            <a href="${flight.link}" target="_blank" 
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-semibold text-gray-800 flex-1">${flight.name}</h5>
                    <span class="text-green-600 font-bold ml-2">${flight.fare}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">${flight.info}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">🔍 ${flight.source}</span>
                    <span class="text-xs text-purple-600">View details →</span>
                </div>
            </a>
        `).join('');
    } else {
        flightsList.innerHTML = `
            <a href="https://www.google.com/flights?q=flights+from+${encodeURIComponent(userOrigin)}+to+${encodeURIComponent(destination)}" 
               target="_blank"
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <h5 class="font-semibold text-gray-800 mb-1">✈️ ${userOrigin} → ${destination}</h5>
                <p class="text-sm text-gray-600">Search and book flights on Google Flights</p>
                <span class="text-xs text-purple-600 mt-2 inline-block">Search flights →</span>
            </a>
        `;
    }

    // Display trains
    const trainsList = document.getElementById('trains-list');
    if (transportation && transportation.trains && transportation.trains.length > 0) {
        trainsList.innerHTML = transportation.trains.map(train => `
            <a href="${train.link}" target="_blank"
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-semibold text-gray-800 flex-1">${train.name}</h5>
                    <span class="text-green-600 font-bold ml-2">${train.fare}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">${train.info}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">� ${train.source}</span>
                    <span class="text-xs text-purple-600">View details →</span>
                </div>
            </a>
        `).join('');
    } else {
        trainsList.innerHTML = `
            <a href="https://www.google.com/search?q=trains+from+${encodeURIComponent(userOrigin)}+to+${encodeURIComponent(destination)}" 
               target="_blank"
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <h5 class="font-semibold text-gray-800 mb-1">🚂 ${userOrigin} → ${destination}</h5>
                <p class="text-sm text-gray-600">Find train schedules and book tickets</p>
                <span class="text-xs text-purple-600 mt-2 inline-block">Search trains →</span>
            </a>
        `;
    }

    // Display hotels
    const hotelsList = document.getElementById('hotels-list');
    if (hotels && hotels.length > 0) {
        hotelsList.innerHTML = hotels.map(hotel => `
            <a href="${hotel.link}" target="_blank"
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-semibold text-gray-800 flex-1">${hotel.name}</h5>
                    <span class="text-green-600 font-bold ml-2">${hotel.fare}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">${hotel.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">🔍 ${hotel.source}</span>
                    <span class="text-xs text-purple-600">Book now →</span>
                </div>
            </a>
        `).join('');
    } else {
        hotelsList.innerHTML = `
            <a href="https://www.google.com/travel/hotels?q=hotels+in+${encodeURIComponent(destination)}" 
               target="_blank"
               class="block p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition">
                <h5 class="font-semibold text-gray-800 mb-1">Search Hotels in ${destination}</h5>
                <p class="text-sm text-gray-600">Find and book hotels on Google Travel</p>
                <span class="text-xs text-purple-600 mt-2 inline-block">Search now →</span>
            </a>
        `;
    }
}

// Regenerate itinerary
document.getElementById('regenerate-itinerary')?.addEventListener('click', async () => {
    const destination = document.getElementById('destination').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!destination || !startDate || !endDate) {
        alert('Please fill in trip details first');
        return;
    }

    document.getElementById('ai-itinerary').innerHTML =
        '<div class="text-center py-8"><div class="spinner mx-auto"></div><p class="mt-4 text-gray-600">Regenerating itinerary...</p></div>';

    await generateItinerary({ destination, start_date: startDate, end_date: endDate });
});

// Load my trips
async function loadMyTrips() {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/trips`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const tripsList = document.getElementById('my-trips-list');
        const trips = response.data.trips || [];

        if (trips.length === 0) {
            tripsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>No trips yet. Create your first trip above!</p>
                </div>
            `;
            return;
        }

        tripsList.innerHTML = trips.map(trip => `
            <div class="trip-card p-6 border border-gray-200 rounded-lg">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-xl font-bold text-gray-800">${trip.destination}</h4>
                        <p class="text-gray-600">${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}</p>
                    </div>
                    <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ${trip.status || 'Planned'}
                    </span>
                </div>
                
                ${trip.daily_predictions && trip.daily_predictions.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 mb-2">Crowd predictions:</p>
                        <div class="flex space-x-2">
                            ${trip.daily_predictions.slice(0, 5).map(pred => {
            const emoji = getCrowdEmoji(pred.crowd_level);
            return `<span title="${pred.date}: ${pred.crowd_level}">${emoji}</span>`;
        }).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex space-x-2">
                    <button onclick="viewTrip('${trip._id}')" class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
                        View Details
                    </button>
                    <button onclick="deleteTrip('${trip._id}')" class="bg-red-100 text-red-600 py-2 px-4 rounded-lg hover:bg-red-200 transition">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

// View trip details
function viewTrip(tripId) {
    // Navigate to trip detail page or show modal
    window.location.href = `/trips/${tripId}`;
}

// Delete trip
async function deleteTrip(tripId) {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
        const token = getAuthToken();
        await axios.delete(`${API_BASE_URL}/api/trips/${tripId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await loadMyTrips();

    } catch (error) {
        console.error('Error deleting trip:', error);
        alert('Failed to delete trip');
    }
}

// Helper functions
function getCrowdEmoji(level) {
    const emojis = {
        'very_low': '🟢',
        'low': '🟡',
        'medium': '🟠',
        'high': '🔴',
        'very_high': '🔴🔴'
    };
    return emojis[level] || '⚪';
}

function getWeatherEmoji(weather) {
    const emojis = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Snow': '❄️',
        'Thunderstorm': '⛈️',
        'Drizzle': '🌦️',
        'Mist': '🌫️'
    };
    return emojis[weather] || '🌤️';
}

// Load sustainable quests for a trip
async function loadQuestsForTrip(tripId) {
    try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/api/quests/for-trip/${tripId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const data = response.data;
        const quests = data.quests || [];

        // Display quests section
        const questsSection = document.getElementById('sustainable-quests');
        if (!questsSection) {
            // Create quests section if it doesn't exist
            const resultsSection = document.getElementById('trip-results');
            const questsDiv = document.createElement('div');
            questsDiv.id = 'sustainable-quests';
            questsDiv.className = 'mt-8';
            questsDiv.innerHTML = `
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">🌱 Sustainable Quests for Your Trip</h3>
                            <p class="text-gray-600 mt-2">Complete these hospitable and eco-friendly activities during your visit</p>
                        </div>
                        <div class="bg-green-100 px-4 py-2 rounded-lg">
                            <span class="text-green-800 font-semibold">${quests.length} Quests Available</span>
                        </div>
                    </div>
                    <div id="quests-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
                </div>
            `;
            resultsSection?.appendChild(questsDiv);
        }

        // Display quests
        const questsGrid = document.getElementById('quests-grid');
        if (questsGrid) {
            questsGrid.innerHTML = quests.map(quest => `
                <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer">
                    <div class="text-4xl mb-3 text-center">${quest.icon || '🎯'}</div>
                    <h4 class="font-bold text-gray-800 mb-2">${quest.title}</h4>
                    <p class="text-sm text-gray-600 mb-3">${quest.description}</p>
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">${quest.category}</span>
                        <span class="font-semibold text-purple-600">${quest.points} pts</span>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded p-2 mb-3">
                        <p class="text-xs text-green-800">
                            <span class="font-semibold">🌍 Impact:</span> ${quest.sustainability_focus}
                        </p>
                    </div>
                    <div class="text-xs text-gray-500">
                        <p class="font-semibold mb-1">Requirements:</p>
                        <ul class="list-disc list-inside space-y-1">
                            ${quest.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading quests for trip:', error);
    }
}

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('start-date').min = today;
document.getElementById('end-date').min = today;

// Update end date min when start date changes
document.getElementById('start-date')?.addEventListener('change', (e) => {
    document.getElementById('end-date').min = e.target.value;
});

// Initialize
document.addEventListener('DOMContentLoaded', loadMyTrips);
