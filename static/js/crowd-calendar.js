// Crowd Calendar Chart using Plotly
const holidayData = {
    "publicHolidaysKarnataka2026": [
        { "date": "2026-01-01", "name": "New Year's Day" },
        { "date": "2026-01-14", "name": "Makara Sankranti" },
        { "date": "2026-01-26", "name": "Republic Day" },
        { "date": "2026-02-04", "name": "Shab-e-Barat" },
        { "date": "2026-03-02", "name": "Holi" },
        { "date": "2026-03-19", "name": "Ugadi" },
        { "date": "2026-04-14", "name": "Dr. Ambedkar Jayanti" },
        { "date": "2026-05-01", "name": "Labour Day" },
        { "date": "2026-05-28", "name": "Bakrid / Eid-al-Adha" },
        { "date": "2026-06-26", "name": "Last Day of Moharam" },
        { "date": "2026-08-15", "name": "Independence Day" },
        { "date": "2026-08-26", "name": "Eid-e-Milad" },
        { "date": "2026-09-14", "name": "Ganesh Chaturthi" },
        { "date": "2026-10-02", "name": "Gandhi Jayanti" },
        { "date": "2026-10-10", "name": "Deepavali" },
        { "date": "2026-11-01", "name": "Kannada Rajyotsava" },
        { "date": "2026-12-25", "name": "Christmas" }
    ],
    "districtOfficialLocalHolidays2026": [
        { "district": "Kodagu", "name": "Kail Muhurtha", "date": "2026-09-03" },
        { "district": "Kodagu", "name": "Tula Sankramana / Kaveri Sankramana", "date": "2026-10-17" },
        { "district": "Kodagu", "name": "Huthri Festival", "date": "2026-11-26" }
    ],
    "districtFestivals": [
        { "district": "Bengaluru Urban", "name": "Bengaluru Karaga", "period": { "start": "2026-03-20", "end": "2026-04-05" } },
        { "district": "Bengaluru Urban", "name": "Kadalekai Parishe", "date": "2026-11-23" },
        { "district": "Mysuru", "name": "Mysuru Dasara", "period": { "start": "2026-10-07", "end": "2026-10-16" } },
        { "district": "Dakshina Kannada", "name": "Kambala (Buffalo Racing)", "season": { "start": "2025-11-20", "end": "2026-03-30" } },
        { "district": "Udupi", "name": "Kambala (Buffalo Racing)", "season": { "start": "2025-11-20", "end": "2026-03-30" } },
        { "district": "Udupi", "name": "Pattanaje", "date": "2026-05-24" },
        { "district": "Shivamogga", "name": "Anegudde Jatra", "date": "2026-12-14" },
        { "district": "Gadag", "name": "Hampi Utsav", "period": { "start": "2026-01-05", "end": "2026-01-12" } },
        { "district": "Ballari", "name": "Siruguppa Dasara", "period": { "start": "2026-10-07", "end": "2026-10-16" } },
        { "district": "Hassan", "name": "Belur Chennakeshava Rathotsava", "period": { "start": "2026-04-10", "end": "2026-04-15" } },
        { "district": "Mandya", "name": "Pandu Ranga Jatre", "period": { "start": "2026-12-10", "end": "2026-12-20" } },
        { "district": "Kolaramma", "name": "Kolaramma Jatre", "period": { "start": "2026-04-05", "end": "2026-04-12" } },
        { "district": "Chitradurga", "name": "Thipperudra Swamy Jatre", "period": { "start": "2026-01-25", "end": "2026-02-05" } },
        { "district": "Bagalkot", "name": "Banashankari Jatre", "period": { "start": "2026-01-14", "end": "2026-02-25" } },
        { "district": "Davangere", "name": "Sri Anjaneya Swamy Jatre", "period": { "start": "2026-03-15", "end": "2026-03-22" } },
        { "district": "Ramanagara", "name": "Sri Revana Siddeshwara Jatre", "period": { "start": "2026-01-15", "end": "2026-01-22" } },
        { "district": "Tumakuru", "name": "Siddaganga Jatre", "period": { "start": "2026-01-10", "end": "2026-01-18" } }
    ]
};

const districtKeywords = {
    "Bengaluru Urban": ["bangalore", "bengaluru", "namma bengaluru"],
    "Mysuru": ["mysore", "mysuru"],
    "Kodagu": ["coorg", "kodagu", "madikeri"],
    "Dakshina Kannada": ["mangalore", "mangaluru", "dakshina kannada"],
    "Udupi": ["udupi", "manipal"],
    "Shivamogga": ["shivamogga", "shimoga", "jog falls"],
    "Hassan": ["hassan", "belur", "halebidu"],
    "Mandya": ["mandya", "srirangapatna"],
    "Kolar": ["kolar", "kolar gold fields"],
    "Chitradurga": ["chitradurga", "molakalmuru"],
    "Bagalkot": ["badami", "bagalkot", "aihole", "pattadakal"],
    "Davangere": ["davangere"],
    "Ramanagara": ["ramanagara", "ramdevarabetta"],
    "Tumakuru": ["tumkur", "tumakuru", "siddaganga"],
    "Ballari": ["bellary", "ballari", "hampi"],
    "Gadag": ["gadag", "lakkundi"]
};

function isSunday(dateStr) {
    return new Date(dateStr).getDay() === 0;
}

function dateInRange(date, start, end) {
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    return d >= s && d <= e;
}

async function findDistrictForDestination(destination) {
    // Try to match by keywords first
    const destLower = destination.toLowerCase();
    for (const [district, keywords] of Object.entries(districtKeywords)) {
        if (keywords.some(keyword => destLower.includes(keyword))) {
            console.log(`Matched ${destination} to ${district} via keywords`);
            return district;
        }
    }

    // If no match, default to Bengaluru Urban
    console.log(`No keyword match for ${destination}, defaulting to Bengaluru Urban`);
    return "Bengaluru Urban";
}

function calculateDayCrowdIntensity(district, date) {
    let intensity = 1;
    let reasons = [];

    const dateStr = date.toISOString().split('T')[0];

    // Check if Sunday
    if (isSunday(dateStr)) {
        intensity += 2;
        reasons.push('Sunday');
    }

    // Check public holidays
    holidayData.publicHolidaysKarnataka2026.forEach(holiday => {
        if (holiday.date === dateStr) {
            intensity += 3;
            reasons.push(holiday.name);
        }
    });

    // Check local holidays
    holidayData.districtOfficialLocalHolidays2026.forEach(holiday => {
        if (holiday.district === district && holiday.date === dateStr) {
            intensity += 3;
            reasons.push(holiday.name);
        }
    });

    // Check festivals
    holidayData.districtFestivals.forEach(festival => {
        if (festival.district === district || festival.district.includes(district)) {
            if (festival.period) {
                if (dateInRange(dateStr, festival.period.start, festival.period.end)) {
                    intensity += 4;
                    reasons.push(festival.name);
                }
            } else if (festival.season) {
                if (dateInRange(dateStr, festival.season.start, festival.season.end)) {
                    intensity += 2;
                    reasons.push(festival.name + ' season');
                }
            } else if (festival.date) {
                const festDate = new Date(festival.date);
                const daysBefore = 2;
                const daysAfter = 2;
                const festStart = new Date(festDate);
                festStart.setDate(festStart.getDate() - daysBefore);
                const festEnd = new Date(festDate);
                festEnd.setDate(festEnd.getDate() + daysAfter);

                if (dateInRange(dateStr, festStart.toISOString().split('T')[0], festEnd.toISOString().split('T')[0])) {
                    intensity += 3;
                    reasons.push(festival.name);
                }
            }
        }
    });

    // Month bonuses (winter months Nov-Feb are peak tourism)
    const month = date.getMonth() + 1;
    if (month >= 11 || month <= 2) {
        intensity += 1;
        reasons.push('Winter season (peak tourism)');
    }

    return { intensity: Math.min(intensity, 10), reasons };
}

function getColorForIntensity(intensity) {
    if (intensity <= 2) return '#00ff41';
    if (intensity <= 4) return '#7fff00';
    if (intensity <= 5) return '#dfff00';
    if (intensity <= 6) return '#ffdf00';
    if (intensity <= 7) return '#ffbf00';
    if (intensity <= 8) return '#ff8000';
    if (intensity <= 9) return '#ff4000';
    return '#ff0000';
}

async function generateCrowdCalendar(destination, startDate, endDate) {
    const district = await findDistrictForDestination(destination);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    const intensities = [];
    const colors = [];
    const hoverTexts = [];
    const events = [];

    let totalIntensity = 0;
    let maxIntensity = 0;
    let maxDay = '';
    let minIntensity = 10;
    let minDay = '';

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        const dateStr = currentDate.toISOString().split('T')[0];
        const { intensity, reasons } = calculateDayCrowdIntensity(district, currentDate);

        dates.push(dateStr);
        intensities.push(intensity);
        totalIntensity += intensity;

        if (intensity > maxIntensity) {
            maxIntensity = intensity;
            maxDay = dateStr;
        }
        if (intensity < minIntensity) {
            minIntensity = intensity;
            minDay = dateStr;
        }

        const color = getColorForIntensity(intensity);
        colors.push(color);

        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        let hoverText = `${dateStr} (${dayName})<br>Crowd Level: ${intensity.toFixed(1)}/10`;
        if (reasons.length > 0) {
            hoverText += '<br><br>Reasons:<br>' + reasons.join('<br>');
        }
        hoverTexts.push(hoverText);

        if (reasons.length > 0) {
            events.push({ date: dateStr, reasons, intensity });
        }
    }

    const tripDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const avgIntensity = totalIntensity / dates.length;

    // Create Plotly chart
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
            bgcolor: 'white',
            bordercolor: '#667eea',
            font: { size: 13 }
        }
    };

    const layout = {
        title: {
            text: `Crowd Intensity Timeline - ${destination} (${district})`,
            font: { size: 20, color: '#333' }
        },
        xaxis: {
            title: 'Date',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickangle: -45
        },
        yaxis: {
            title: 'Crowd Intensity',
            range: [0, 10],
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickvals: [0, 2, 4, 6, 8, 10]
        },
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        hovermode: 'closest',
        height: 600,
        margin: { l: 60, r: 40, t: 80, b: 100 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    Plotly.newPlot('crowd-calendar-chart', [trace], layout, config);

    // Update stats
    document.getElementById('trip-duration').textContent = tripDuration + ' days';
    document.getElementById('avg-crowd').textContent = avgIntensity.toFixed(1) + '/10';
    document.getElementById('peak-day').textContent = new Date(maxDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    document.getElementById('quiet-day').textContent = new Date(minDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Generate events list
    const eventsList = document.getElementById('events-list');
    if (events.length > 0) {
        const getCrowdBadge = (intensity) => {
            if (intensity > 7) return '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Very High</span>';
            if (intensity > 5) return '<span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">High</span>';
            if (intensity > 3) return '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Moderate</span>';
            return '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Low</span>';
        };

        eventsList.innerHTML = `
            <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
                <h4 class="text-lg font-bold text-gray-800 mb-4">📅 Events During Your Trip</h4>
                <div class="space-y-3">
                    ${events.map(event => `
                        <div class="bg-white p-4 rounded-lg shadow-sm">
                            <div class="flex justify-between items-center mb-2">
                                <div class="font-bold text-purple-700">
                                    ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                                ${getCrowdBadge(event.intensity)}
                            </div>
                            <div class="text-gray-700">${event.reasons.join(', ')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        eventsList.innerHTML = `
            <div class="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
                <p class="text-green-800">✅ No major events during your trip - expect regular crowd levels!</p>
            </div>
        `;
    }
}
