// Karnataka Holiday and Festival Data for Crowd Predictions

export const holidayData = {
    publicHolidaysKarnataka2026: [
        { date: "2026-01-01", name: "New Year's Day" },
        { date: "2026-01-14", name: "Makara Sankranti" },
        { date: "2026-01-26", name: "Republic Day" },
        { date: "2026-02-04", name: "Shab-e-Barat" },
        { date: "2026-03-02", name: "Holi" },
        { date: "2026-03-19", name: "Ugadi" },
        { date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
        { date: "2026-05-01", name: "Labour Day" },
        { date: "2026-05-28", name: "Bakrid / Eid-al-Adha" },
        { date: "2026-06-26", name: "Last Day of Moharam" },
        { date: "2026-08-15", name: "Independence Day" },
        { date: "2026-08-26", name: "Eid-e-Milad" },
        { date: "2026-09-14", name: "Ganesh Chaturthi" },
        { date: "2026-10-02", name: "Gandhi Jayanti" },
        { date: "2026-10-10", name: "Deepavali" },
        { date: "2026-11-01", name: "Kannada Rajyotsava" },
        { date: "2026-12-25", name: "Christmas" }
    ],
    districtOfficialLocalHolidays2026: [
        { district: "Kodagu", name: "Kail Muhurtha", date: "2026-09-03" },
        { district: "Kodagu", name: "Tula Sankramana / Kaveri Sankramana", date: "2026-10-17" },
        { district: "Kodagu", name: "Huthri Festival", date: "2026-11-26" }
    ],
    districtFestivals: [
        { district: "Bengaluru Urban", name: "Bengaluru Karaga", period: { start: "2026-03-20", end: "2026-04-05" } },
        { district: "Bengaluru Urban", name: "Kadalekai Parishe", date: "2026-11-23" },
        { district: "Mysuru", name: "Mysuru Dasara", period: { start: "2026-10-07", end: "2026-10-16" } },
        { district: "Dakshina Kannada", name: "Kambala (Buffalo Racing)", season: { start: "2025-11-20", end: "2026-03-30" } },
        { district: "Udupi", name: "Kambala (Buffalo Racing)", season: { start: "2025-11-20", end: "2026-03-30" } },
        { district: "Udupi", name: "Pattanaje", date: "2026-05-24" },
        { district: "Shivamogga", name: "Anegudde Jatra", date: "2026-12-14" },
        { district: "Gadag", name: "Hampi Utsav", period: { start: "2026-01-05", end: "2026-01-12" } },
        { district: "Ballari", name: "Siruguppa Dasara", period: { start: "2026-10-07", end: "2026-10-16" } },
        { district: "Hassan", name: "Belur Chennakeshava Rathotsava", period: { start: "2026-04-10", end: "2026-04-15" } },
        { district: "Mandya", name: "Pandu Ranga Jatre", period: { start: "2026-12-10", end: "2026-12-20" } },
        { district: "Chitradurga", name: "Thipperudra Swamy Jatre", period: { start: "2026-01-25", end: "2026-02-05" } },
        { district: "Bagalkot", name: "Banashankari Jatre", period: { start: "2026-01-14", end: "2026-02-25" } },
        { district: "Davangere", name: "Sri Anjaneya Swamy Jatre", period: { start: "2026-03-15", end: "2026-03-22" } },
        { district: "Ramanagara", name: "Sri Revana Siddeshwara Jatre", period: { start: "2026-01-15", end: "2026-01-22" } },
        { district: "Tumakuru", name: "Siddaganga Jatre", period: { start: "2026-01-10", end: "2026-01-18" } }
    ]
}

export const districtKeywords = {
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
    "Gadag": ["gadag", "lakkundi"],
    "Chikkamagaluru": ["chikmagalur", "chikkamagaluru"],
    "Uttara Kannada": ["gokarna", "murudeshwar", "karwar"],
    "Chamarajanagar": ["bandipur", "chamarajanagar"]
}

/**
 * Find district for a destination
 */
export function findDistrictForDestination(destination) {
    const destLower = destination.toLowerCase()
    for (const [district, keywords] of Object.entries(districtKeywords)) {
        if (keywords.some(keyword => destLower.includes(keyword))) {
            return district
        }
    }
    return "Bengaluru Urban" // Default
}

/**
 * Check if date is in range
 */
function dateInRange(date, start, end) {
    const d = new Date(date)
    const s = new Date(start)
    const e = new Date(end)
    return d >= s && d <= e
}

/**
 * Calculate crowd intensity for a specific day
 */
export function calculateDayCrowdIntensity(district, date) {
    let intensity = 1
    let reasons = []

    const dateStr = date.toISOString().split('T')[0]

    // Check if Sunday
    if (date.getDay() === 0) {
        intensity += 2
        reasons.push('Sunday')
    }

    // Check public holidays
    holidayData.publicHolidaysKarnataka2026.forEach(holiday => {
        if (holiday.date === dateStr) {
            intensity += 3
            reasons.push(holiday.name)
        }
    })

    // Check local holidays
    holidayData.districtOfficialLocalHolidays2026.forEach(holiday => {
        if (holiday.district === district && holiday.date === dateStr) {
            intensity += 3
            reasons.push(holiday.name)
        }
    })

    // Check festivals
    holidayData.districtFestivals.forEach(festival => {
        if (festival.district === district || festival.district.includes(district)) {
            if (festival.period) {
                if (dateInRange(dateStr, festival.period.start, festival.period.end)) {
                    intensity += 4
                    reasons.push(festival.name)
                }
            } else if (festival.season) {
                if (dateInRange(dateStr, festival.season.start, festival.season.end)) {
                    intensity += 2
                    reasons.push(festival.name + ' season')
                }
            } else if (festival.date) {
                const festDate = new Date(festival.date)
                const daysBefore = 2
                const daysAfter = 2
                const festStart = new Date(festDate)
                festStart.setDate(festStart.getDate() - daysBefore)
                const festEnd = new Date(festDate)
                festEnd.setDate(festEnd.getDate() + daysAfter)

                if (dateInRange(dateStr, festStart.toISOString().split('T')[0], festEnd.toISOString().split('T')[0])) {
                    intensity += 3
                    reasons.push(festival.name)
                }
            }
        }
    })

    // Winter months bonus
    const month = date.getMonth() + 1
    if (month >= 11 || month <= 2) {
        intensity += 1
        reasons.push('Winter season (peak tourism)')
    }

    return { intensity: Math.min(intensity, 10), reasons }
}

/**
 * Get color for intensity value
 */
export function getColorForIntensity(intensity) {
    if (intensity <= 2) return '#00ff41'
    if (intensity <= 4) return '#7fff00'
    if (intensity <= 5) return '#dfff00'
    if (intensity <= 6) return '#ffdf00'
    if (intensity <= 7) return '#ffbf00'
    if (intensity <= 8) return '#ff8000'
    if (intensity <= 9) return '#ff4000'
    return '#ff0000'
}
