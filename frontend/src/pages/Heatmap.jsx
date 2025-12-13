import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { karnatakaHotspots, calculateCrowdLevel } from '../data/karnatakaHotspots'

export default function Heatmap() {
    const location = useLocation()
    const questFromState = location.state?.quest

    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const tileLayerRef = useRef(null)
    const heatLayerRef = useRef(null)
    const markersRef = useRef([])
    const questMarkerRef = useRef(null)

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [stats, setStats] = useState({
        selectedDate: '-', dayOfWeek: '-', avgCrowd: '-',
        mostCrowded: { name: '-', level: 0 },
        leastCrowded: { name: '-', level: 10 }
    })

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([15.3173, 75.7139], 7)
        }
        return () => {
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
        }
    }, [])

    useEffect(() => {
        if (!mapInstanceRef.current) return
        if (tileLayerRef.current) mapInstanceRef.current.removeLayer(tileLayerRef.current)
        tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd', maxZoom: 18
        }).addTo(mapInstanceRef.current)
    }, [])

    // Handle quest marker from navigation state
    useEffect(() => {
        if (!mapInstanceRef.current || !questFromState) return

        // Remove previous quest marker if exists
        if (questMarkerRef.current) {
            mapInstanceRef.current.removeLayer(questMarkerRef.current)
        }

        // Find quest coordinates - match by location name with karnatakaHotspots
        let questCoords = null
        const questLocation = questFromState.location?.toLowerCase() || ''

        // Try to find matching hotspot
        const matchingHotspot = karnatakaHotspots.find(h =>
            questLocation.includes(h.name.toLowerCase()) ||
            h.name.toLowerCase().includes(questLocation)
        )

        if (matchingHotspot) {
            questCoords = matchingHotspot.coords
        } else if (questFromState.coordinates) {
            questCoords = [questFromState.coordinates.lat, questFromState.coordinates.lng]
        }

        if (questCoords) {
            // Create custom quest marker icon (pulsing gold marker)
            const questIcon = L.divIcon({
                className: 'quest-marker',
                html: `
                    <div style="
                        position: relative;
                        width: 40px;
                        height: 40px;
                    ">
                        <div style="
                            position: absolute;
                            width: 40px;
                            height: 40px;
                            background: rgba(196, 163, 90, 0.3);
                            border-radius: 50%;
                            animation: pulse 2s infinite;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 8px;
                            left: 8px;
                            width: 24px;
                            height: 24px;
                            background: linear-gradient(135deg, #c4a35a, #f0d78c);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            box-shadow: 0 4px 15px rgba(196, 163, 90, 0.5);
                        ">🎯</div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })

            questMarkerRef.current = L.marker(questCoords, { icon: questIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                    <div style="font-family: Inter, sans-serif; min-width: 180px;">
                        <div style="color: #c4a35a; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                            🎯 ${questFromState.name}
                        </div>
                        <div style="color: #888; font-size: 12px; margin-bottom: 6px;">
                            📍 ${questFromState.location}
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 8px;">
                            <span style="
                                background: rgba(196, 163, 90, 0.2);
                                color: #c4a35a;
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-size: 12px;
                            ">${questFromState.points} pts</span>
                            <span style="
                                background: rgba(34, 197, 94, 0.2);
                                color: #22c55e;
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-size: 12px;
                            ">${questFromState.category || 'Quest'}</span>
                        </div>
                    </div>
                `)
                .openPopup()

            // Pan and zoom to quest location
            mapInstanceRef.current.setView(questCoords, 12)
        }
    }, [questFromState])

    useEffect(() => { if (mapInstanceRef.current) updateHeatmap() }, [selectedDate])

    const updateHeatmap = () => {
        if (!mapInstanceRef.current) return
        const date = new Date(selectedDate)
        const points = []
        let totalCrowd = 0, maxCrowd = { name: '', level: 0 }, minCrowd = { name: '', level: 10 }

        markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m))
        markersRef.current = []

        karnatakaHotspots.forEach(hotspot => {
            const intensity = calculateCrowdLevel(hotspot, date)
            const crowdLevel = Math.round(intensity * 10)
            for (let i = 0; i < 15; i++) {
                points.push([hotspot.coords[0] + (Math.random() - 0.5) * 0.3, hotspot.coords[1] + (Math.random() - 0.5) * 0.3, intensity])
            }
            totalCrowd += crowdLevel
            if (crowdLevel > maxCrowd.level) maxCrowd = { name: hotspot.name, level: crowdLevel }
            if (crowdLevel < minCrowd.level) minCrowd = { name: hotspot.name, level: crowdLevel }

            const marker = L.circleMarker(hotspot.coords, {
                radius: 8, fillColor: getColorForLevel(crowdLevel), color: '#c4a35a', weight: 2, opacity: 1, fillOpacity: 0.8
            }).addTo(mapInstanceRef.current)
            marker.bindPopup(`<div style="font-family:Inter;"><strong style="color:#c4a35a">${hotspot.name}</strong><br/>District: ${hotspot.district}<br/>Crowd: ${crowdLevel}/10</div>`)
            markersRef.current.push(marker)
        })

        if (heatLayerRef.current) mapInstanceRef.current.removeLayer(heatLayerRef.current)
        heatLayerRef.current = L.heatLayer(points, {
            radius: 50, blur: 45, maxZoom: 10, max: 1.0,
            gradient: { 0.0: '#22c55e', 0.3: '#eab308', 0.6: '#f97316', 0.8: '#ef4444', 1.0: '#991b1b' }
        }).addTo(mapInstanceRef.current)

        setStats({
            selectedDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
            avgCrowd: `${(totalCrowd / karnatakaHotspots.length).toFixed(1)}/10`,
            mostCrowded: maxCrowd, leastCrowded: minCrowd
        })
    }

    const getColorForLevel = (level) => {
        if (level <= 2) return '#22c55e'
        if (level <= 4) return '#84cc16'
        if (level <= 6) return '#eab308'
        if (level <= 8) return '#f97316'
        return '#ef4444'
    }

    return (
        <div className="min-h-screen luxury-bg-aurora luxury-scrollbar">
            <div className="container mx-auto px-6 py-12 relative z-10">

                {/* Header */}
                <div className="text-center mb-12">
                    <p className="luxury-subheading mb-4">CROWD INTELLIGENCE</p>
                    <h1 className="luxury-heading text-5xl md:text-6xl mb-4">
                        <span className="luxury-heading-gold">Karnataka Heatmap</span>
                    </h1>
                    <p className="luxury-text-muted">Real-time crowd intensity for 24 destinations</p>
                </div>

                {/* Date Selector */}
                <div className="glass-card p-6 mb-8">
                    <div className="flex items-center gap-5 flex-wrap">
                        <label className="luxury-subheading">SELECT DATE</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="luxury-input"
                        />
                    </div>
                </div>

                {/* Map */}
                <div className="glass-card overflow-hidden mb-8">
                    <div ref={mapRef} style={{ height: '550px', width: '100%' }} />
                </div>

                {/* Legend & Stats */}
                <div className="glass-card p-8">
                    <p className="luxury-subheading mb-2">CROWD SCALE</p>
                    <h3 className="luxury-heading-gold text-xl mb-6">Intensity Legend</h3>

                    <div className="flex items-center gap-3 mb-6">
                        <span className="luxury-text-muted text-sm">Low</span>
                        <div className="flex-1 h-8 rounded-lg" style={{ background: 'linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444)' }} />
                        <span className="luxury-text-muted text-sm">Extreme</span>
                    </div>

                    <div className="flex justify-between luxury-text-muted text-xs mb-8 flex-wrap gap-2">
                        <span>1-2: Peaceful</span>
                        <span>3-4: Moderate</span>
                        <span>5-6: Busy</span>
                        <span>7-8: Crowded</span>
                        <span>9-10: Packed</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="luxury-stat-card">
                            <div className="luxury-stat-value text-lg">{stats.selectedDate}</div>
                            <div className="luxury-stat-label">Date</div>
                        </div>
                        <div className="luxury-stat-card">
                            <div className="luxury-stat-value text-lg">{stats.dayOfWeek}</div>
                            <div className="luxury-stat-label">Day</div>
                        </div>
                        <div className="luxury-stat-card">
                            <div className="luxury-stat-value text-lg">{stats.avgCrowd}</div>
                            <div className="luxury-stat-label">Average</div>
                        </div>
                        <div className="luxury-stat-card">
                            <div className="luxury-stat-value text-sm">{stats.mostCrowded.name}</div>
                            <div className="luxury-stat-label">Most Crowded ({stats.mostCrowded.level}/10)</div>
                        </div>
                        <div className="luxury-stat-card">
                            <div className="luxury-stat-value text-sm">{stats.leastCrowded.name}</div>
                            <div className="luxury-stat-label">Quietest ({stats.leastCrowded.level}/10)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
