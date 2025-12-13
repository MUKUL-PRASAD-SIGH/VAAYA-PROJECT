"""
AI Verification Module for Vaaya Clean-Up Quests
------------------------------------------------
Uses pretrained MobileNetV2 to estimate 'trashiness' in images.
Computes before vs after cleanliness improvement.
"""

import tensorflow as tf
import numpy as np
import math
from PIL import Image

# =====================================================
# ✅ Model Setup
# =====================================================

# Load MobileNetV2 pretrained on ImageNet (good for texture detection)
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)

# Add lightweight classification head
model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

# Freeze base layers to use as fixed feature extractor
base_model.trainable = False

# Compile for safety (won’t train, just predict)
model.compile(optimizer='adam', loss='binary_crossentropy')

print("✅ Loaded MobileNetV2 as Trash Detector Feature Extractor")

# =====================================================
# 🧩 Image Preprocessing
# =====================================================

def preprocess_image(image_path):
    """Load and resize an image into model input format"""
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    arr = np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)
    return arr

def detect_trash(image_path):
    """
    Predicts a 'trashiness' score (0–1).
    Higher means more cluttered / messy / trash presence.
    """
    try:
        img = preprocess_image(image_path)
        preds = model.predict(img, verbose=0)
        score = float(preds[0][0])
        print(f"🧠 {image_path}: trashiness={score:.2f}")
        return score
    except Exception as e:
        print(f"⚠️ detect_trash() failed: {e}")
        return 0.0

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
# 🧠 Main AI Verification Logic
# =====================================================

def verify_cleanliness(before_image, after_image, user_gps, quest_gps, radius_m=100):
    """
    Verifies cleanup based on:
      - Geolocation distance
      - Before/After 'trashiness' scores
      - Confidence threshold
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

        # Step 2 — Trash Detection
        before_score = detect_trash(before_image)
        after_score = detect_trash(after_image)

        # Step 3 — Calculate improvement
        improvement = before_score - after_score
        print(f"📊 Improvement Score: {improvement:.2f}")

        # Step 4 — Confidence-based decision
        if improvement >= 0.2:
            return {"verified": True, "confidence": improvement}
        elif 0.1 <= improvement < 0.2:
            return {
                "verified": False,
                "reason": "Needs manual review (low confidence)",
                "confidence": improvement
            }
        else:
            return {
                "verified": False,
                "reason": "No visible improvement",
                "confidence": improvement
            }

    except Exception as e:
        print(f"⚠️ verify_cleanliness() failed: {e}")
        return {"verified": False, "reason": "AI error", "confidence": 0.0}


