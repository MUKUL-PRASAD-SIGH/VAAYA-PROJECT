import { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { useTheme } from '../../context/ThemeContext'
import {
    holidayData,
    findDistrictForDestination,
    calculateDayCrowdIntensity,
    getColorForIntensity
} from '../../data/holidayData'

export default function CrowdCalendar({ destination, startDate, endDate, onStatsUpdate }) {
    const { isDarkMode } = useTheme()
    const [plotData, setPlotData] = useState(null)
    const [events, setEvents] = useState([])

    useEffect(() => {
        if (destination && startDate && endDate) {
            generateCalendarData()
        }
    }, [destination, startDate, endDate])

    const generateCalendarData = () => {
        const district = findDistrictForDestination(destination)
        const start = new Date(startDate)
        const end = new Date(endDate)
        const dates = []
        const intensities = []
        const colors = []
        const hoverTexts = []
        const eventsList = []

        let totalIntensity = 0
        let maxIntensity = 0
        let maxDay = ''
        let minIntensity = 10
        let minDay = ''

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d)
            const dateStr = currentDate.toISOString().split('T')[0]
            const { intensity, reasons } = calculateDayCrowdIntensity(district, currentDate)

            dates.push(dateStr)
            intensities.push(intensity)
            totalIntensity += intensity

            if (intensity > maxIntensity) {
                maxIntensity = intensity
                maxDay = dateStr
            }
            if (intensity < minIntensity) {
                minIntensity = intensity
                minDay = dateStr
            }

            const color = getColorForIntensity(intensity)
            colors.push(color)

            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })
            let hoverText = `${dateStr} (${dayName})<br>Crowd Level: ${intensity.toFixed(1)}/10`
            if (reasons.length > 0) {
                hoverText += '<br><br>Reasons:<br>' + reasons.join('<br>')
            }
            hoverTexts.push(hoverText)

            if (reasons.length > 0) {
                eventsList.push({ date: dateStr, reasons, intensity })
            }
        }

        const tripDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
        const avgIntensity = totalIntensity / dates.length

        // Update parent stats
        if (onStatsUpdate) {
            onStatsUpdate({
                tripDuration: `${tripDuration} days`,
                avgCrowd: avgIntensity.toFixed(1),
                peakDay: new Date(maxDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                quietDay: new Date(minDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                district
            })
        }

        setEvents(eventsList)

        // Create Plotly trace
        const trace = {
            x: dates,
            y: intensities,
            type: 'scatter',
            mode: 'lines+markers',
            fill: 'tozeroy',
            fillcolor: 'rgba(102, 126, 234, 0.2)',
            line: {
                color: 'rgba(102, 126, 234, 0.8)',
                width: 3,
                shape: 'spline'
            },
            marker: {
                size: 12,
                color: colors,
                line: {
                    color: 'white',
                    width: 2
                }
            },
            hovertext: hoverTexts,
            hoverinfo: 'text',
            hoverlabel: {
                bgcolor: isDarkMode ? '#1f2937' : 'white',
                bordercolor: '#667eea',
                font: { size: 13, color: isDarkMode ? '#f3f4f6' : '#1f2937' }
            }
        }

        const layout = {
            title: {
                text: `Crowd Intensity Timeline - ${destination} (${district})`,
                font: { size: 20, color: isDarkMode ? '#f3f4f6' : '#333' }
            },
            xaxis: {
                title: 'Date',
                showgrid: true,
                gridcolor: isDarkMode ? '#374151' : '#f0f0f0',
                tickangle: -45,
                tickfont: { color: isDarkMode ? '#9ca3af' : '#333' }
            },
            yaxis: {
                title: 'Crowd Intensity',
                range: [0, 10],
                showgrid: true,
                gridcolor: isDarkMode ? '#374151' : '#f0f0f0',
                tickvals: [0, 2, 4, 6, 8, 10],
                tickfont: { color: isDarkMode ? '#9ca3af' : '#333' }
            },
            plot_bgcolor: isDarkMode ? '#1f2937' : '#fafafa',
            paper_bgcolor: isDarkMode ? '#1f2937' : 'white',
            hovermode: 'closest',
            height: 500,
            margin: { l: 60, r: 40, t: 80, b: 100 }
        }

        setPlotData({ data: [trace], layout })
    }

    const getCrowdBadge = (intensity) => {
        if (intensity > 7) return 'bg-red-100 text-red-800'
        if (intensity > 5) return 'bg-orange-100 text-orange-800'
        if (intensity > 3) return 'bg-yellow-100 text-yellow-800'
        return 'bg-green-100 text-green-800'
    }

    const getCrowdLabel = (intensity) => {
        if (intensity > 7) return 'Very High'
        if (intensity > 5) return 'High'
        if (intensity > 3) return 'Moderate'
        return 'Low'
    }

    const textPrimary = isDarkMode ? 'text-gray-100' : 'text-gray-800'
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-600'
    const cardClass = isDarkMode ? 'bg-gray-800' : 'bg-white'

    if (!plotData) {
        return (
            <div className={`${cardClass} rounded-lg shadow-lg p-8 text-center`}>
                <p className={textSecondary}>Enter trip details above to generate crowd calendar</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Plotly Chart */}
            <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
                <Plot
                    data={plotData.data}
                    layout={plotData.layout}
                    config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                    style={{ width: '100%' }}
                />
            </div>

            {/* Events List */}
            {events.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">📅 Events During Your Trip</h4>
                    <div className="space-y-3">
                        {events.map((event, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="font-bold text-purple-700">
                                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCrowdBadge(event.intensity)}`}>
                                        {getCrowdLabel(event.intensity)}
                                    </span>
                                </div>
                                <div className="text-gray-700">{event.reasons.join(', ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {events.length === 0 && (
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
                    <p className="text-green-800">✅ No major events during your trip - expect regular crowd levels!</p>
                </div>
            )}
        </div>
    )
}
