import { useState, useEffect } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CrowdCalendar from '../components/trips/CrowdCalendar'
import { tripsApi, aiApi } from '../services/api'

export default function Trips() {
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
    const [tripSaved, setTripSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [calendarStats, setCalendarStats] = useState({
        tripDuration: '0 days',
        avgCrowd: '0.0',
        peakDay: '-',
        quietDay: '-',
        district: '-'
    })

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
        setFormData((prev) => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setTripSaved(false)

        try {
            const itineraryResponse = await aiApi.generateItinerary({
                destination: formData.destination,
                start_date: formData.startDate,
                end_date: formData.endDate,
                budget: formData.budget,
                purpose: formData.purpose,
                origin: 'Bengaluru',
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

    const handleSaveTrip = async () => {
        setSaving(true)
        try {
            const tripData = {
                destination: formData.destination,
                start_date: formData.startDate,
                end_date: formData.endDate,
                location_coords: { lat: 12.9716, lng: 77.5946 },
                country_code: 'IN',
                preferences: { budget: formData.budget, purpose: formData.purpose }
            }
            console.log('Saving trip with data:', tripData)
            const response = await tripsApi.create(tripData)
            console.log('Trip saved successfully:', response)
            setTripSaved(true)
            loadMyTrips()
        } catch (error) {
            console.error('Error saving trip:', error)
            alert(`Failed to save trip: ${error.response?.data?.error || error.message}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">

                {/* Hero Header */}
                <div className="text-center mb-12">
                    <p className="luxury-subheading mb-4">PLAN YOUR JOURNEY</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        <span className="luxury-heading-gold">Trip Planner</span>
                    </h1>
                    <p className="luxury-text-muted max-w-2xl mx-auto">
                        Create unforgettable adventures with AI-powered crowd predictions
                    </p>
                </div>

                {/* Create Trip Form */}
                <div className="glass-card p-8 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="luxury-subheading mb-2">NEW ADVENTURE</p>
                            <h2 className="luxury-heading-gold text-3xl">Plan Your Trip</h2>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="luxury-subheading block mb-2">DESTINATION</label>
                                <input
                                    type="text"
                                    id="destination"
                                    value={formData.destination}
                                    onChange={handleInputChange}
                                    className="w-full luxury-input"
                                    placeholder="e.g., Mysuru, Hampi, Coorg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="luxury-subheading block mb-2">FROM</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full luxury-input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="luxury-subheading block mb-2">TO</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="w-full luxury-input"
                                    required
                                />
                            </div>

                            <div>
                                <label className="luxury-subheading block mb-2">BUDGET</label>
                                <select
                                    id="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    className="w-full luxury-input"
                                    required
                                >
                                    <option value="">Select budget</option>
                                    <option value="budget">Budget (₹5,000-15,000)</option>
                                    <option value="moderate">Moderate (₹15,000-30,000)</option>
                                    <option value="luxury">Luxury (₹30,000+)</option>
                                </select>
                            </div>

                            <div>
                                <label className="luxury-subheading block mb-2">PURPOSE</label>
                                <select
                                    id="purpose"
                                    value={formData.purpose}
                                    onChange={handleInputChange}
                                    className="w-full luxury-input"
                                    required
                                >
                                    <option value="">Select purpose</option>
                                    <option value="leisure">Leisure & Relaxation</option>
                                    <option value="adventure">Adventure & Sports</option>
                                    <option value="culture">Cultural & Heritage</option>
                                    <option value="pilgrimage">Religious & Pilgrimage</option>
                                    <option value="food">Food & Culinary</option>
                                    <option value="nature">Nature & Wildlife</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="gold-button w-full md:w-auto"
                        >
                            {loading ? 'Generating...' : 'Generate Trip Plan'}
                        </button>
                    </form>

                    {showResults && !tripSaved && (
                        <button
                            onClick={handleSaveTrip}
                            disabled={saving}
                            className="gold-button-outline w-full md:w-auto mt-4"
                        >
                            {saving ? 'Saving...' : '💾 Save Trip'}
                        </button>
                    )}
                    {tripSaved && (
                        <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                            ✅ Trip saved successfully!
                        </div>
                    )}
                </div>

                {/* Trip Results */}
                {showResults && (
                    <div className="space-y-8 fade-in">

                        {/* Crowd Calendar */}
                        <div className="glass-card p-8">
                            <div className="mb-6">
                                <p className="luxury-subheading mb-2">CROWD PREDICTIONS</p>
                                <h2 className="luxury-heading-gold text-2xl">Daily Crowd Intensity</h2>
                            </div>

                            <CrowdCalendar
                                destination={formData.destination}
                                startDate={formData.startDate}
                                endDate={formData.endDate}
                                onStatsUpdate={setCalendarStats}
                            />

                            {/* Trip Stats */}
                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="luxury-stat-card">
                                    <div className="luxury-stat-value text-2xl">{calendarStats.tripDuration}</div>
                                    <div className="luxury-stat-label">Duration</div>
                                </div>
                                <div className="luxury-stat-card">
                                    <div className="luxury-stat-value text-2xl">{calendarStats.avgCrowd}/10</div>
                                    <div className="luxury-stat-label">Avg Crowd</div>
                                </div>
                                <div className="luxury-stat-card">
                                    <div className="luxury-stat-value text-2xl">{calendarStats.peakDay}</div>
                                    <div className="luxury-stat-label">Peak Day</div>
                                </div>
                                <div className="luxury-stat-card">
                                    <div className="luxury-stat-value text-2xl">{calendarStats.quietDay}</div>
                                    <div className="luxury-stat-label">Quietest</div>
                                </div>
                            </div>
                        </div>

                        {/* AI Itinerary */}
                        <div className="glass-card p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="luxury-subheading mb-2">AI-POWERED</p>
                                    <h2 className="luxury-heading-gold text-2xl">Your Itinerary</h2>
                                </div>
                                <button onClick={handleSubmit} className="gold-button-outline text-sm">
                                    Regenerate
                                </button>
                            </div>
                            <div className="luxury-text whitespace-pre-wrap font-light leading-relaxed">
                                {itinerary}
                            </div>
                        </div>

                        {/* Transportation */}
                        {transportation && (transportation.flights?.length > 0 || transportation.trains?.length > 0) && (
                            <div className="glass-card p-8">
                                <div className="mb-6">
                                    <p className="luxury-subheading mb-2">TRAVEL OPTIONS</p>
                                    <h2 className="luxury-heading-gold text-2xl">Transportation</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {transportation.flights?.length > 0 && (
                                        <div>
                                            <h4 className="luxury-text font-semibold mb-4">✈️ Flights</h4>
                                            <div className="space-y-3">
                                                {transportation.flights.slice(0, 5).map((flight, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={flight.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block glass-card p-4 hover:bg-[rgba(255,255,255,0.08)]"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="luxury-text font-medium">{flight.airline || 'Flight'}</p>
                                                                <p className="luxury-text-muted text-sm">{flight.route || `To ${formData.destination}`}</p>
                                                            </div>
                                                            <span style={{ color: '#c4a35a' }} className="font-bold">{flight.fare}</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {transportation.trains?.length > 0 && (
                                        <div>
                                            <h4 className="luxury-text font-semibold mb-4">🚂 Trains</h4>
                                            <div className="space-y-3">
                                                {transportation.trains.slice(0, 5).map((train, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={train.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block glass-card p-4 hover:bg-[rgba(255,255,255,0.08)]"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="luxury-text font-medium">{train.name || 'Train'}</p>
                                                                <p className="luxury-text-muted text-sm">{train.duration || train.route}</p>
                                                            </div>
                                                            <span style={{ color: '#c4a35a' }} className="font-bold">{train.fare}</span>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {hotels.length > 0 && (
                            <div className="glass-card p-8">
                                <div className="mb-6">
                                    <p className="luxury-subheading mb-2">ACCOMMODATIONS</p>
                                    <h2 className="luxury-heading-gold text-2xl">Recommended Stays</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {hotels.slice(0, 9).map((hotel, idx) => (
                                        <a
                                            key={idx}
                                            href={hotel.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block glass-card p-4 hover:bg-[rgba(255,255,255,0.08)]"
                                        >
                                            <h4 className="luxury-text font-semibold text-sm mb-2">{hotel.name}</h4>
                                            <p className="luxury-text-muted text-xs mb-2 line-clamp-2">{hotel.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span style={{ color: '#c4a35a' }} className="font-bold">{hotel.fare}</span>
                                                <span className="luxury-text-muted text-xs">{hotel.source}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* My Trips */}
                <div className="glass-card p-8 mt-12">
                    <div className="mb-6">
                        <p className="luxury-subheading mb-2">YOUR ADVENTURES</p>
                        <h2 className="luxury-heading-gold text-2xl">My Trips</h2>
                    </div>

                    <div className="space-y-4">
                        {tripsLoading ? (
                            <div className="text-center py-8">
                                <p className="luxury-text-muted">Loading your trips...</p>
                            </div>
                        ) : myTrips.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="luxury-text-muted">No trips planned yet. Create your first adventure above!</p>
                            </div>
                        ) : (
                            myTrips.map((trip) => (
                                <div
                                    key={trip._id || trip.id}
                                    className="glass-card p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                                            style={{ background: 'linear-gradient(135deg, #1a4a5c, #2d6a7c)' }}>
                                            ✈️
                                        </div>
                                        <div>
                                            <h4 className="luxury-text font-semibold">{trip.destination}</h4>
                                            <p className="luxury-text-muted text-sm">
                                                {trip.start_date} - {trip.end_date}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs"
                                        style={{ backgroundColor: 'rgba(196, 163, 90, 0.2)', color: '#c4a35a' }}>
                                        {trip.status || 'Planned'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Loading Modal */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="glass-card p-8 text-center">
                            <LoadingSpinner size="md" />
                            <p className="luxury-text font-semibold mt-4">Generating your trip plan...</p>
                            <p className="luxury-text-muted text-sm mt-2">AI is predicting crowds and creating your itinerary</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
