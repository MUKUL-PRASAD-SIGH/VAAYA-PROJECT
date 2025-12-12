import { useState, useEffect } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CrowdCalendar from '../components/trips/CrowdCalendar'
import { tripsApi, aiApi } from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Trips() {
    const { isDarkMode } = useTheme()
    const [formData, setFormData] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        budget: '',
        purpose: '',
    })
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [itinerary, setItinerary] = useState('')
    const [transportation, setTransportation] = useState(null)
    const [hotels, setHotels] = useState([])
    const [myTrips, setMyTrips] = useState([])
    const [tripsLoading, setTripsLoading] = useState(true)
    const [calendarStats, setCalendarStats] = useState({
        tripDuration: '0 days',
        avgCrowd: '0.0',
        peakDay: '-',
        quietDay: '-',
        district: '-'
    })

    // Dark mode classes
    const cardClass = isDarkMode ? 'bg-gray-800 rounded-lg shadow-lg' : 'bg-white rounded-lg shadow-lg'
    const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-500'
    const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'
    const inputClass = isDarkMode
        ? 'bg-gray-700 text-gray-100 border-gray-600 focus:border-purple-500'
        : 'bg-white text-gray-800 border-gray-300 focus:border-purple-500'

    useEffect(() => {
        loadMyTrips()
    }, [])

    const loadMyTrips = async () => {
        try {
            const response = await tripsApi.getAll()
            setMyTrips(response.data.trips || [])
        } catch (error) {
            console.error('Error loading trips:', error)
        } finally {
            setTripsLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const itineraryResponse = await aiApi.generateItinerary({
                destination: formData.destination,
                start_date: formData.startDate,
                end_date: formData.endDate,
                budget: formData.budget,
                purpose: formData.purpose,
                origin: 'Bengaluru', // Default origin for transportation search
            })

            setItinerary(itineraryResponse.data.itinerary || '')
            setTransportation(itineraryResponse.data.transportation || null)
            setHotels(itineraryResponse.data.hotels || [])

            setShowResults(true)
        } catch (error) {
            console.error('Error generating trip plan:', error)
            setItinerary(`
## Day 1 - Arrival in ${formData.destination}
- Morning: Arrive and check into hotel
- Afternoon: Explore local markets
- Evening: Traditional dinner experience

## Day 2 - Cultural Exploration
- Morning: Visit historical sites
- Afternoon: Local food tour
- Evening: Sunset viewpoint

## Day 3 - Adventure Day
- Full day: Adventure activities and nature exploration
            `)
            setShowResults(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-3xl font-bold ${textPrimary} mb-2`}>Trip Planner 🗺️</h2>
                <p className={textSecondary}>Plan your perfect trip with AI-powered crowd predictions</p>
            </div>

            {/* Create Trip Section */}
            <div className={`${cardClass} p-8 mb-8`}>
                <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>Plan a New Trip</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`block ${textSecondary} font-semibold mb-2`}>Destination</label>
                            <input
                                type="text"
                                id="destination"
                                value={formData.destination}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                placeholder="e.g., Mysuru, Hampi, Coorg, Gokarna, Udupi"
                                required
                            />
                        </div>

                        <div>
                            <label className={`block ${textSecondary} font-semibold mb-2`}>Start Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block ${textSecondary} font-semibold mb-2`}>End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block ${textSecondary} font-semibold mb-2`}>Budget</label>
                            <select
                                id="budget"
                                value={formData.budget}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                required
                            >
                                <option value="">Select budget range</option>
                                <option value="budget">Budget (₹5,000-15,000)</option>
                                <option value="moderate">Moderate (₹15,000-30,000)</option>
                                <option value="luxury">Luxury (₹30,000+)</option>
                            </select>
                        </div>

                        <div>
                            <label className={`block ${textSecondary} font-semibold mb-2`}>Purpose of Visit</label>
                            <select
                                id="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                required
                            >
                                <option value="">Select purpose</option>
                                <option value="leisure">Leisure & Relaxation</option>
                                <option value="adventure">Adventure & Sports</option>
                                <option value="culture">Cultural & Heritage</option>
                                <option value="pilgrimage">Religious & Pilgrimage</option>
                                <option value="food">Food & Culinary</option>
                                <option value="nature">Nature & Wildlife</option>
                                <option value="shopping">Shopping & Entertainment</option>
                                <option value="business">Business & Work</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Trip Plan with AI 🚀'}
                    </button>
                </form>
            </div>

            {/* Trip Results */}
            {showResults && (
                <div className="fade-in space-y-8">
                    {/* Crowd Calendar */}
                    <div className={`${cardClass} p-8`}>
                        <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>📅 Daily Crowd Intensity Calendar</h3>

                        <CrowdCalendar
                            destination={formData.destination}
                            startDate={formData.startDate}
                            endDate={formData.endDate}
                            onStatsUpdate={setCalendarStats}
                        />

                        {/* Trip Stats */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Trip Duration</div>
                                <div className="text-2xl font-bold text-purple-700">{calendarStats.tripDuration}</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Average Crowd</div>
                                <div className="text-2xl font-bold text-blue-700">{calendarStats.avgCrowd}/10</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Peak Crowd Day</div>
                                <div className="text-2xl font-bold text-red-700">{calendarStats.peakDay}</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Quietest Day</div>
                                <div className="text-2xl font-bold text-green-700">{calendarStats.quietDay}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI-Generated Itinerary */}
                    <div className={`${cardClass} p-8`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-2xl font-bold ${textPrimary}`}>AI-Generated Itinerary 🤖</h3>
                            <button
                                onClick={handleSubmit}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                            >
                                Regenerate
                            </button>
                        </div>
                        <div className="prose max-w-none">
                            <pre className={`whitespace-pre-wrap ${textSecondary} font-sans`}>
                                {itinerary}
                            </pre>
                        </div>
                    </div>

                    {/* Transportation Options from Serper API */}
                    {transportation && (transportation.flights?.length > 0 || transportation.trains?.length > 0) && (
                        <div className={`${cardClass} p-8`}>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>🚀 Transportation Options</h3>
                            <p className={`${textMuted} text-sm mb-4`}>Powered by Google Search</p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Flights */}
                                {transportation.flights?.length > 0 && (
                                    <div>
                                        <h4 className={`text-lg font-semibold ${textPrimary} mb-3`}>✈️ Flights</h4>
                                        <div className="space-y-3">
                                            {transportation.flights.slice(0, 5).map((flight, idx) => (
                                                <a
                                                    key={idx}
                                                    href={flight.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`block p-4 border ${borderColor} rounded-lg hover:border-purple-400 transition`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className={`font-medium ${textPrimary}`}>{flight.airline || 'Flight'}</p>
                                                            <p className={`text-sm ${textMuted}`}>{flight.route || `To ${formData.destination}`}</p>
                                                        </div>
                                                        <span className="text-green-600 font-bold">{flight.fare}</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trains */}
                                {transportation.trains?.length > 0 && (
                                    <div>
                                        <h4 className={`text-lg font-semibold ${textPrimary} mb-3`}>🚂 Trains</h4>
                                        <div className="space-y-3">
                                            {transportation.trains.slice(0, 5).map((train, idx) => (
                                                <a
                                                    key={idx}
                                                    href={train.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`block p-4 border ${borderColor} rounded-lg hover:border-purple-400 transition`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className={`font-medium ${textPrimary}`}>{train.name || 'Train'}</p>
                                                            <p className={`text-sm ${textMuted}`}>{train.duration || train.route || `To ${formData.destination}`}</p>
                                                        </div>
                                                        <span className="text-green-600 font-bold">{train.fare}</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hotels from Serper API */}
                    {hotels.length > 0 && (
                        <div className={`${cardClass} p-8`}>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>🏨 Recommended Hotels</h3>
                            <p className={`${textMuted} text-sm mb-4`}>Prices and availability from Google Search</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {hotels.slice(0, 9).map((hotel, idx) => (
                                    <a
                                        key={idx}
                                        href={hotel.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block p-4 border ${borderColor} rounded-lg hover:border-purple-400 hover:shadow-md transition`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={`font-semibold ${textPrimary} text-sm`}>{hotel.name}</h4>
                                        </div>
                                        <p className={`text-xs ${textMuted} mb-2 line-clamp-2`}>{hotel.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-600 font-bold">{hotel.fare}</span>
                                            <span className={`text-xs ${textMuted}`}>{hotel.source}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weather Forecast */}
                    <div className={`${cardClass} p-8`}>
                        <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>Weather Forecast ☀️</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {[...Array(7)].map((_, index) => (
                                <div key={index} className={`text-center p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                                    <p className={`text-sm ${textMuted}`}>Day {index + 1}</p>
                                    <p className="text-3xl my-2">☀️</p>
                                    <p className={`font-bold ${textPrimary}`}>28°C</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* My Trips */}
            <div className={`${cardClass} p-8 mt-8`}>
                <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>My Trips</h3>
                <div className="space-y-4">
                    {tripsLoading ? (
                        <div className={`text-center py-8 ${textMuted}`}>
                            <p>Loading your trips...</p>
                        </div>
                    ) : myTrips.length === 0 ? (
                        <div className={`text-center py-8 ${textMuted}`}>
                            <p>No trips planned yet. Create your first trip above!</p>
                        </div>
                    ) : (
                        myTrips.map((trip) => (
                            <div
                                key={trip._id || trip.id}
                                className={`p-4 border ${borderColor} rounded-lg hover:border-purple-300 transition`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className={`font-semibold ${textPrimary}`}>{trip.destination}</h4>
                                        <p className={`text-sm ${textMuted}`}>
                                            {trip.start_date} - {trip.end_date}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} rounded-full text-sm`}>
                                        {trip.status || 'Planned'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Loading Modal */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`${cardClass} p-8 text-center`}>
                        <LoadingSpinner size="md" />
                        <p className={`${textPrimary} font-semibold mt-4`}>Generating your trip plan...</p>
                        <p className={`${textMuted} text-sm mt-2`}>Using AI to predict crowds and create itinerary</p>
                    </div>
                </div>
            )}
        </div>
    )
}
