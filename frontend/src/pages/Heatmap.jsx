import { useState, useEffect, useRef, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useTheme } from '../context/ThemeContext'
import { karnatakaHotspots, calculateCrowdLevel, months } from '../data/karnatakaHotspots'

export default function Heatmap() {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const tileLayerRef = useRef(null)
    const heatLayerRef = useRef(null)
    const markersRef = useRef([])
    const { isDarkMode } = useTheme()

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [stats, setStats] = useState({
        selectedDate: '-',
        dayOfWeek: '-',
        avgCrowd: '-',
        mostCrowded: { name: '-', level: 0 },
        leastCrowded: { name: '-', level: 10 }
    })

    // Dark mode classes
    const cardClass = isDarkMode ? 'bg-gray-800' : 'bg-white'
    const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    const inputClass = isDarkMode
        ? 'bg-gray-700 text-gray-100 border-gray-600'
        : 'bg-white text-gray-800 border-gray-300'

    // Initialize map centered on Karnataka
    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([15.3173, 75.7139], 7)
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Update tile layer when dark mode changes
    useEffect(() => {
        if (!mapInstanceRef.current) return

        if (tileLayerRef.current) {
            mapInstanceRef.current.removeLayer(tileLayerRef.current)
        }

        const tileUrl = isDarkMode
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

        tileLayerRef.current = L.tileLayer(tileUrl, {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 18
        }).addTo(mapInstanceRef.current)
    }, [isDarkMode])

    // Update heatmap when date changes
    useEffect(() => {
        if (!mapInstanceRef.current) return
        updateHeatmap()
    }, [selectedDate])

    const updateHeatmap = () => {
        if (!mapInstanceRef.current) return

        const date = new Date(selectedDate)
        const points = []
        let totalCrowd = 0
        let maxCrowd = { name: '', level: 0 }
        let minCrowd = { name: '', level: 10 }

        // Clear existing markers
        markersRef.current.forEach(marker => mapInstanceRef.current.removeLayer(marker))
        markersRef.current = []

        karnatakaHotspots.forEach(hotspot => {
            const intensity = calculateCrowdLevel(hotspot, date)
            const crowdLevel = Math.round(intensity * 10)

            // Add multiple points for better heatmap spread
            for (let i = 0; i < 15; i++) {
                const latOffset = (Math.random() - 0.5) * 0.3
                const lngOffset = (Math.random() - 0.5) * 0.3
                points.push([
                    hotspot.coords[0] + latOffset,
                    hotspot.coords[1] + lngOffset,
                    intensity
                ])
            }

            totalCrowd += crowdLevel
            if (crowdLevel > maxCrowd.level) {
                maxCrowd = { name: hotspot.name, level: crowdLevel }
            }
            if (crowdLevel < minCrowd.level) {
                minCrowd = { name: hotspot.name, level: crowdLevel }
            }

            // Add marker with popup
            const marker = L.circleMarker(hotspot.coords, {
                radius: 8,
                fillColor: getColorForLevel(crowdLevel),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(mapInstanceRef.current)

            marker.bindPopup(`
                <strong>${hotspot.name}</strong><br/>
                District: ${hotspot.district}<br/>
                Type: ${hotspot.type}<br/>
                Crowd Level: ${crowdLevel}/10
            `)

            markersRef.current.push(marker)
        })

        // Remove existing heat layer
        if (heatLayerRef.current) {
            mapInstanceRef.current.removeLayer(heatLayerRef.current)
        }

        // Create new heat layer
        heatLayerRef.current = L.heatLayer(points, {
            radius: 50,
            blur: 45,
            maxZoom: 10,
            max: 1.0,
            gradient: {
                0.0: '#00ff00',
                0.2: '#80ff00',
                0.4: '#ffff00',
                0.6: '#ff8000',
                0.8: '#ff0000',
                1.0: '#8b0000'
            }
        }).addTo(mapInstanceRef.current)

        // Update stats
        const avgCrowd = (totalCrowd / karnatakaHotspots.length).toFixed(1)
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]
        const dateFormatted = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

        setStats({
            selectedDate: dateFormatted,
            dayOfWeek: dayName,
            avgCrowd: `${avgCrowd}/10`,
            mostCrowded: maxCrowd,
            leastCrowded: minCrowd
        })
    }

    const getColorForLevel = (level) => {
        if (level <= 2) return '#00ff00'
        if (level <= 4) return '#80ff00'
        if (level <= 6) return '#ffff00'
        if (level <= 8) return '#ff8000'
        return '#ff0000'
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 className={`text-4xl font-bold ${textPrimary} mb-2`}>🗺️ Karnataka Tourist Heatmap</h2>
                <p className={textSecondary}>Real-time crowd intensity visualization for 24 popular destinations</p>
            </div>

            {/* Date Selector */}
            <div className={`${cardClass} rounded-lg shadow-lg p-6 mb-8`}>
                <div className="flex items-center gap-5 flex-wrap">
                    <label className={`text-lg font-semibold ${textSecondary}`}>Select Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={`px-5 py-3 border-2 border-purple-600 rounded-xl text-lg hover:border-purple-800 hover:shadow-lg transition-all ${inputClass}`}
                    />
                </div>
            </div>

            {/* Map */}
            <div className={`${cardClass} rounded-lg shadow-lg overflow-hidden mb-8`}>
                <div
                    ref={mapRef}
                    style={{ height: '600px', width: '100%' }}
                />
            </div>

            {/* Legend and Stats */}
            <div className={`${cardClass} rounded-lg shadow-lg p-8`}>
                <h3 className={`text-2xl font-bold ${textPrimary} mb-5`}>Crowd Intensity Scale</h3>

                <div className="flex items-center gap-3 mb-6">
                    <span className={textSecondary}>Low</span>
                    <div
                        className="flex-1 h-12 rounded-lg shadow-md"
                        style={{ background: 'linear-gradient(to right, #00ff00, #80ff00, #ffff00, #ff8000, #ff0000, #8b0000)' }}
                    />
                    <span className={textSecondary}>Extreme</span>
                </div>

                <div className={`flex justify-between text-sm ${textSecondary} mb-8 flex-wrap gap-2`}>
                    <span>1-2: Peaceful</span>
                    <span>3-4: Moderate</span>
                    <span>5-6: Busy</span>
                    <span>7-8: Crowded</span>
                    <span>9-10: Packed</span>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-5 rounded-xl shadow-md`}>
                        <h4 className="text-purple-600 text-sm font-semibold uppercase mb-2">Selected Date</h4>
                        <p className={`text-xl font-bold ${textPrimary}`}>{stats.selectedDate}</p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-5 rounded-xl shadow-md`}>
                        <h4 className="text-purple-600 text-sm font-semibold uppercase mb-2">Day of Week</h4>
                        <p className={`text-xl font-bold ${textPrimary}`}>{stats.dayOfWeek}</p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-5 rounded-xl shadow-md`}>
                        <h4 className="text-purple-600 text-sm font-semibold uppercase mb-2">Average Crowd</h4>
                        <p className={`text-xl font-bold ${textPrimary}`}>{stats.avgCrowd}</p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-5 rounded-xl shadow-md`}>
                        <h4 className="text-purple-600 text-sm font-semibold uppercase mb-2">Most Crowded</h4>
                        <p className={`text-lg font-bold ${textPrimary}`}>{stats.mostCrowded.name}</p>
                        <p className={`text-sm ${textSecondary}`}>({stats.mostCrowded.level}/10)</p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} p-5 rounded-xl shadow-md`}>
                        <h4 className="text-purple-600 text-sm font-semibold uppercase mb-2">Least Crowded</h4>
                        <p className={`text-lg font-bold ${textPrimary}`}>{stats.leastCrowded.name}</p>
                        <p className={`text-sm ${textSecondary}`}>({stats.leastCrowded.level}/10)</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
