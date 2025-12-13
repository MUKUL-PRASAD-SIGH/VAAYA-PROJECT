"""
AI Verification Module for Vaaya Clean-Up Quests
------------------------------------------------
MOCK VERSION - TensorFlow disabled for development.
Returns placeholder results to allow backend to run.
"""

import math

print("⚠️ Quest Verifier running in MOCK mode (TensorFlow disabled)")

# =====================================================
# 📍 Geolocation Helper (Haversine)
# =====================================================

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate GPS distance in meters between two coordinates"""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# =====================================================
# 🧠 Mock AI Verification Logic
# =====================================================

def verify_cleanliness(before_image, after_image, user_gps, quest_gps, radius_m=100):
    """
    MOCK: Returns successful verification for development.
    Real implementation requires TensorFlow.
    """
    try:
        # Step 1 — Check proximity
        distance = calculate_distance(user_gps[0], user_gps[1], quest_gps[0], quest_gps[1])
        if distance > radius_m:
            return {
                "verified": False,
                "reason": f"Out of location range ({round(distance,1)}m > {radius_m}m)",
                "confidence": 0.0
            }

        # MOCK: Return successful verification
        print(f"🧪 MOCK verify_cleanliness called - returning success")
        return {"verified": True, "confidence": 0.85, "mock": True}

    except Exception as e:
        print(f"⚠️ verify_cleanliness() failed: {e}")
        return {"verified": False, "reason": "AI error", "confidence": 0.0}
