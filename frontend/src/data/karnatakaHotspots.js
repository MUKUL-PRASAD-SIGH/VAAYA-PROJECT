// Karnataka Tourist Hotspots Data
// Contains 24 popular tourist destinations with crowd prediction data

export const karnatakaHotspots = [
    { name: "Bengaluru Palace", coords: [12.998, 77.592], district: "Bengaluru Urban", type: "Heritage", crowd_score: 78, peak_season: ["October", "November", "December", "January"], off_season: ["April", "May"] },
    { name: "Lalbagh Botanical Garden", coords: [12.950, 77.585], district: "Bengaluru Urban", type: "Nature Park", crowd_score: 85, peak_season: ["January", "August"], off_season: ["June"] },
    { name: "Bannerghatta Biological Park", coords: [12.805, 77.577], district: "Bengaluru Urban", type: "Wildlife Safari", crowd_score: 90, peak_season: ["December", "January", "May"], off_season: ["July", "August"] },
    { name: "Nandi Hills", coords: [13.370, 77.683], district: "Chikkaballapur", type: "Hill Viewpoint", crowd_score: 95, peak_season: ["September", "October", "November", "December", "January", "February"], off_season: ["April", "May"] },
    { name: "Mysore Palace", coords: [12.305, 76.655], district: "Mysuru", type: "Heritage", crowd_score: 98, peak_season: ["September", "October", "December"], off_season: ["June"] },
    { name: "Chamundi Hills", coords: [12.273, 76.673], district: "Mysuru", type: "Temple + Hill", crowd_score: 92, peak_season: ["August", "September"], off_season: ["April"] },
    { name: "Brindavan Gardens", coords: [12.424, 76.572], district: "Mandya", type: "Garden", crowd_score: 88, peak_season: ["October", "November", "December", "January"], off_season: ["June"] },
    { name: "Coorg", coords: [12.424, 75.740], district: "Kodagu", type: "Hill Station", crowd_score: 96, peak_season: ["October", "November", "December", "January", "February", "March"], off_season: ["June", "July"] },
    { name: "Abbey Falls", coords: [12.454, 75.718], district: "Kodagu", type: "Waterfall", crowd_score: 85, peak_season: ["July", "August", "September"], off_season: ["April"] },
    { name: "Chikmagalur", coords: [13.315, 75.775], district: "Chikkamagaluru", type: "Hill Station", crowd_score: 94, peak_season: ["October", "November", "December", "January", "February"], off_season: ["April", "May"] },
    { name: "Mullayanagiri Peak", coords: [13.389, 75.728], district: "Chikkamagaluru", type: "Trek", crowd_score: 90, peak_season: ["November", "December"], off_season: ["July"] },
    { name: "Gokarna", coords: [14.548, 74.320], district: "Uttara Kannada", type: "Beach", crowd_score: 89, peak_season: ["December", "January"], off_season: ["June", "July"] },
    { name: "Murudeshwar", coords: [14.094, 74.485], district: "Uttara Kannada", type: "Temple + Beach", crowd_score: 92, peak_season: ["January", "February", "December"], off_season: ["June"] },
    { name: "Karwar Beach", coords: [14.814, 74.129], district: "Uttara Kannada", type: "Beach", crowd_score: 76, peak_season: ["November", "December", "January", "February"], off_season: ["June", "July"] },
    { name: "Hampi", coords: [15.335, 76.460], district: "Vijayanagara", type: "Heritage + Trek", crowd_score: 95, peak_season: ["November", "December", "January"], off_season: ["April", "May"] },
    { name: "Aihole", coords: [15.953, 75.798], district: "Bagalkot", type: "Heritage", crowd_score: 65, peak_season: ["December", "January"], off_season: ["May"] },
    { name: "Badami Caves", coords: [15.917, 75.678], district: "Bagalkot", type: "Heritage", crowd_score: 78, peak_season: ["December", "January"], off_season: ["April"] },
    { name: "Bandipur National Park", coords: [11.668, 76.453], district: "Chamarajanagar", type: "Safari", crowd_score: 82, peak_season: ["January", "December", "April"], off_season: ["July", "August"] },
    { name: "Kabini Backwaters", coords: [11.955, 76.190], district: "Mysuru", type: "Wildlife + Resort", crowd_score: 91, peak_season: ["April", "May"], off_season: ["July"] },
    { name: "Jog Falls", coords: [14.229, 74.812], district: "Shivamogga", type: "Waterfall", crowd_score: 92, peak_season: ["July", "August", "September"], off_season: ["February"] },
    { name: "Agumbe", coords: [13.513, 75.091], district: "Shivamogga", type: "Rainforest", crowd_score: 66, peak_season: ["October", "November", "December", "January"], off_season: ["July"] },
    { name: "Udupi Sri Krishna Temple", coords: [13.339, 74.746], district: "Udupi", type: "Temple", crowd_score: 88, peak_season: ["August", "December"], off_season: ["June"] },
    { name: "Malpe Beach", coords: [13.350, 74.705], district: "Udupi", type: "Beach", crowd_score: 82, peak_season: ["December", "January"], off_season: ["June", "July"] },
    { name: "St Mary's Island", coords: [13.361, 74.689], district: "Udupi", type: "Island", crowd_score: 85, peak_season: ["December", "January"], off_season: ["June", "July", "August"] }
]

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/**
 * Calculate crowd level for a hotspot on a given date
 * @param {Object} hotspot - Hotspot object from karnatakaHotspots
 * @param {Date} date - Date to calculate for
 * @returns {number} - Intensity value between 0 and 1
 */
export function calculateCrowdLevel(hotspot, date) {
    const monthIndex = date.getMonth()
    const monthName = months[monthIndex]
    const dayOfWeek = date.getDay()
    const baseCrowd = hotspot.crowd_score

    let modifier = 1.0

    // Peak season bonus
    if (hotspot.peak_season.includes(monthName)) {
        modifier = 1.3
    } else if (hotspot.off_season.includes(monthName)) {
        modifier = 0.6
    }

    // Weekend bonus
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        modifier *= 1.2
    }

    // Special event bonuses
    if (monthName === "September" && (hotspot.name.includes("Mysore") || hotspot.name.includes("Chamundi"))) {
        modifier *= 1.4 // Dasara
    }
    if (monthName === "August" && hotspot.type.includes("Temple")) {
        modifier *= 1.3 // Festival season
    }
    if ((monthName === "January" || monthName === "August") && hotspot.name.includes("Lalbagh")) {
        modifier *= 1.5 // Flower shows
    }

    const adjustedCrowd = Math.min(100, baseCrowd * modifier)
    return adjustedCrowd / 100
}
