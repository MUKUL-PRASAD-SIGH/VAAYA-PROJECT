from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from utils.jwt_utils import token_required
from db import db

hospitality_bp = Blueprint("hospitality", __name__)

# -----------------------------------------------
# 1️⃣ CREATE OFFER (Local Host)
# -----------------------------------------------
@hospitality_bp.route("/offer/create", methods=["POST"])
@token_required
def create_offer(current_user):
    if current_user.get("role") != "local":
        return jsonify({"error": "Only locals can create hospitality offerings"}), 403

    data = request.get_json()

    offer_doc = {
        "host_id": ObjectId(current_user["_id"]),
        "title": data["title"],
        "description": data["description"],
        "category": data["category"],
        "price": data["price"],
        "images": data.get("images", []),
        "location": data.get("location", {}),
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = db.hospitality_offers.insert_one(offer_doc)

    return jsonify({
        "success": True,
        "offer_id": str(result.inserted_id)
    }), 201


# -----------------------------------------------
# 2️⃣ GET ALL OFFERS BY THIS HOST
# -----------------------------------------------
@hospitality_bp.route("/my-offers", methods=["GET"])
@token_required
def my_offers(current_user):
    offers = list(db.hospitality_offers.find({"host_id": ObjectId(current_user["_id"])}))

    for o in offers:
        o["_id"] = str(o["_id"])

    return jsonify({"success": True, "offers": offers})


# -----------------------------------------------
# 3️⃣ TRAVELER BOOKS AN OFFER
# -----------------------------------------------
@hospitality_bp.route("/book/<offer_id>", methods=["POST"])
@token_required
def book_offer(current_user, offer_id):
    offer = db.hospitality_offers.find_one({"_id": ObjectId(offer_id)})
    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    booking = {
        "offer_id": ObjectId(offer_id),
        "host_id": offer["host_id"],
        "traveler_id": ObjectId(current_user["_id"]),
        "status": "confirmed",
        "amount_paid": offer["price"],
        "booking_time": datetime.utcnow(),
        "experience_date": request.json.get("experience_date"),
        "rating": None,
        "review_text": None
    }

    db.hospitality_bookings.insert_one(booking)

    return jsonify({"success": True, "message": "Booking confirmed!"})


# -----------------------------------------------
# 4️⃣ SUBMIT HOSPITALITY REVIEW
# -----------------------------------------------
@hospitality_bp.route("/review/<booking_id>", methods=["POST"])
@token_required
def submit_review(current_user, booking_id):
    data = request.get_json()

    booking = db.hospitality_bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return jsonify({"error": "Invalid booking"}), 404

    review_doc = {
        "offer_id": booking["offer_id"],
        "booking_id": ObjectId(booking_id),
        "traveler_id": ObjectId(current_user["_id"]),
        "host_id": booking["host_id"],
        "rating": data["rating"],
        "review_text": data["review"],
        "tone": "positive",
        "created_at": datetime.utcnow()
    }

    db.hospitality_reviews.insert_one(review_doc)

    db.hospitality_bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"rating": data["rating"], "review_text": data["review"]}}
    )

    return jsonify({"success": True})


# -----------------------------------------------
# 5️⃣ HOSPITALITY DASHBOARD STATS
# -----------------------------------------------
@hospitality_bp.route("/stats", methods=["GET"])
@token_required
def hospitality_stats(current_user):
    host_id = ObjectId(current_user["_id"])

    total_guests = db.hospitality_bookings.count_documents({"host_id": host_id})

    avg_rating_pipeline = [
        {"$match": {"host_id": host_id}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
    ]
    rating = list(db.hospitality_reviews.aggregate(avg_rating_pipeline))
    avg_rating = round(rating[0]["avg_rating"], 2) if rating and rating[0].get("avg_rating") else 0

    monthly_earnings_pipeline = [
        {"$match": {"host_id": host_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    earnings = list(db.hospitality_bookings.aggregate(monthly_earnings_pipeline))
    monthly_earnings = earnings[0]["total"] if earnings and earnings[0].get("total") else 0

    hospitality_index = round((avg_rating * 20) + (total_guests * 0.1), 2)

    return jsonify({
        "success": True,
        "total_guests": total_guests,
        "avg_rating": avg_rating,
        "monthly_earnings": monthly_earnings,
        "hospitality_index": hospitality_index
    })


# -----------------------------------------------
# 6️⃣ HOST ENDPOINTS (Match Frontend API)
# -----------------------------------------------

@hospitality_bp.route("/host/experiences", methods=["GET"])
@token_required
def get_host_experiences(current_user):
    """Get all experiences/offerings by this host"""
    offers = list(db.hospitality_offers.find({"host_id": ObjectId(current_user["_id"])}))
    
    for o in offers:
        o["_id"] = str(o["_id"])
        o["host_id"] = str(o["host_id"])
        # Add computed fields for frontend
        bookings_count = db.hospitality_bookings.count_documents({"offer_id": ObjectId(o["_id"])})
        reviews = list(db.hospitality_reviews.find({"offer_id": ObjectId(o["_id"])}))
        avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
        
        o["total_bookings"] = bookings_count
        o["avg_rating"] = round(avg_rating, 1)
        o["reviews_count"] = len(reviews)
        o["guest_limit"] = o.get("guest_limit", 10)
        o["photos"] = o.get("images", ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"])

    return jsonify({"success": True, "experiences": offers})


@hospitality_bp.route("/host/experiences", methods=["POST"])
@token_required
def create_host_experience(current_user):
    """Create a new experience/offering"""
    data = request.get_json()

    offer_doc = {
        "host_id": ObjectId(current_user["_id"]),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "culinary"),
        "price": data.get("price", 0),
        "guest_limit": data.get("guest_limit", 6),
        "duration": data.get("duration", "2 hours"),
        "city": data.get("city", ""),
        "images": data.get("images", []),
        "location": data.get("location", {}),
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = db.hospitality_offers.insert_one(offer_doc)

    return jsonify({
        "success": True,
        "experience_id": str(result.inserted_id),
        "message": "Experience created successfully"
    }), 201


@hospitality_bp.route("/host/bookings", methods=["GET"])
@token_required
def get_host_bookings(current_user):
    """Get all bookings for this host's experiences"""
    host_id = ObjectId(current_user["_id"])
    bookings = list(db.hospitality_bookings.find({"host_id": host_id}))
    
    for b in bookings:
        b["_id"] = str(b["_id"])
        b["offer_id"] = str(b["offer_id"])
        b["host_id"] = str(b["host_id"])
        b["traveler_id"] = str(b["traveler_id"])
        
        # Get experience details
        offer = db.hospitality_offers.find_one({"_id": ObjectId(b["offer_id"])})
        b["experience"] = {"title": offer["title"] if offer else "Unknown"}
        b["experience_id"] = b["offer_id"]
        
        # Get guest details
        guest = db.users.find_one({"_id": ObjectId(b["traveler_id"])})
        b["guest"] = {"name": guest.get("name", "Guest") if guest else "Guest", "avatar": None}
        
        # Map fields for frontend
        b["slot"] = b.get("experience_date") or b.get("booking_time")
        b["guests"] = b.get("guest_count", 1)
        b["total_amount"] = b.get("amount_paid", 0)

    return jsonify({"success": True, "bookings": bookings})


@hospitality_bp.route("/host/bookings/<booking_id>", methods=["PUT"])
@token_required
def update_host_booking(current_user, booking_id):
    """Update booking status (confirm/cancel)"""
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ["confirmed", "cancelled", "pending", "completed"]:
        return jsonify({"error": "Invalid status"}), 400
    
    result = db.hospitality_bookings.update_one(
        {"_id": ObjectId(booking_id), "host_id": ObjectId(current_user["_id"])},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        return jsonify({"error": "Booking not found or not authorized"}), 404
    
    return jsonify({"success": True, "message": f"Booking {new_status}"})


@hospitality_bp.route("/host/stats", methods=["GET"])
@token_required
def get_host_stats(current_user):
    """Get comprehensive stats for host dashboard"""
    host_id = ObjectId(current_user["_id"])
    
    # Total bookings
    total_bookings = db.hospitality_bookings.count_documents({"host_id": host_id})
    
    # Total earnings
    earnings_pipeline = [
        {"$match": {"host_id": host_id, "status": {"$in": ["confirmed", "completed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    earnings_result = list(db.hospitality_bookings.aggregate(earnings_pipeline))
    total_earnings = earnings_result[0]["total"] if earnings_result else 0
    
    # This month's earnings
    from datetime import timedelta
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_pipeline = [
        {"$match": {"host_id": host_id, "booking_time": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    monthly_result = list(db.hospitality_bookings.aggregate(monthly_pipeline))
    this_month_earnings = monthly_result[0]["total"] if monthly_result else 0
    
    # Average rating
    rating_pipeline = [
        {"$match": {"host_id": host_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    rating_result = list(db.hospitality_reviews.aggregate(rating_pipeline))
    avg_rating = round(rating_result[0]["avg"], 2) if rating_result and rating_result[0].get("avg") else 0
    total_reviews = rating_result[0]["count"] if rating_result else 0
    
    # Repeat guests
    repeat_pipeline = [
        {"$match": {"host_id": host_id}},
        {"$group": {"_id": "$traveler_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}},
        {"$count": "repeat_guests"}
    ]
    repeat_result = list(db.hospitality_bookings.aggregate(repeat_pipeline))
    repeat_guests = repeat_result[0]["repeat_guests"] if repeat_result else 0
    
    # Completion rate
    completed = db.hospitality_bookings.count_documents({"host_id": host_id, "status": "completed"})
    completion_rate = round((completed / total_bookings * 100) if total_bookings > 0 else 100, 1)
    
    # Hospitality score calculation
    hospitality_score = min(100, round((avg_rating * 15) + (total_bookings * 0.2) + (completion_rate * 0.3), 1))

    return jsonify({
        "success": True,
        "hospitality_score": hospitality_score,
        "total_earnings": total_earnings,
        "this_month_earnings": this_month_earnings,
        "total_bookings": total_bookings,
        "avg_rating": avg_rating,
        "total_reviews": total_reviews,
        "completion_rate": completion_rate,
        "repeat_guests": repeat_guests
    })


@hospitality_bp.route("/host/reviews", methods=["GET"])
@token_required  
def get_host_reviews(current_user):
    """Get all reviews for this host's experiences"""
    host_id = ObjectId(current_user["_id"])
    reviews = list(db.hospitality_reviews.find({"host_id": host_id}).sort("created_at", -1).limit(50))
    
    for r in reviews:
        r["_id"] = str(r["_id"])
        r["offer_id"] = str(r["offer_id"])
        r["host_id"] = str(r["host_id"])
        r["traveler_id"] = str(r["traveler_id"])
        
        # Get guest name
        guest = db.users.find_one({"_id": ObjectId(r["traveler_id"])})
        r["guest"] = {"name": guest.get("name", "Guest") if guest else "Guest"}
        
        # Get experience name
        offer = db.hospitality_offers.find_one({"_id": ObjectId(r["offer_id"])})
        r["experience"] = offer["title"] if offer else "Experience"
        
        # Format timestamp
        created = r.get("created_at")
        if created:
            delta = datetime.utcnow() - created
            if delta.days == 0:
                r["timestamp"] = "Today"
            elif delta.days == 1:
                r["timestamp"] = "Yesterday"
            elif delta.days < 7:
                r["timestamp"] = f"{delta.days} days ago"
            else:
                r["timestamp"] = f"{delta.days // 7} weeks ago"
        else:
            r["timestamp"] = "Recently"
        
        r["review"] = r.get("review_text", "")
        r["helpful"] = r.get("helpful_count", 0)

    return jsonify({"success": True, "reviews": reviews})

