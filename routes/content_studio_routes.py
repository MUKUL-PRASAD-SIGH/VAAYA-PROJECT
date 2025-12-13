from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import math, os
from models import content_items, content_revisions, media_assets, ai_moderation_jobs, content_unlocks, users_collection
from utils.jwt_utils import token_required
from ai.content_ai import enhance_and_moderate

content_bp = Blueprint("content", __name__, url_prefix="/api/content")

# ---------- helpers ----------
def haversine_m(lat1, lon1, lat2, lon2):
    R=6371000
    import math
    p1,p2=math.radians(lat1),math.radians(lat2)
    dphi=math.radians(lat2-lat1); dl=math.radians(lon2-lon1)
    a=math.sin(dphi/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R*2*math.atan2(math.sqrt(a),math.sqrt(1-a))

# ---------- 1) create draft ----------
@content_bp.route("/create", methods=["POST"])
@token_required
def create_content(current_user):
    if current_user.get("role") != "local":
        return jsonify({"error":"Only locals can create content"}), 403

    data = request.get_json()
    required = ["type","title","body","lat","lng"]
    if any(k not in data for k in required):
        return jsonify({"error":"Missing fields: type,title,body,lat,lng"}), 400

    doc = {
        "type": data["type"],
        "title": data["title"],
        "summary": data.get("summary"),
        "body": data["body"],
        "media": data.get("media", []),
        "tags": data.get("tags", []),
        "themes": data.get("themes", []),
        "location": {"type":"Point","coordinates":[float(data["lng"]), float(data["lat"])], "radius_m": int(data.get("radius_m",120))},
        "unlock_mode": data.get("unlock_mode","geo"),
        "status": "draft",
        "ai_flags": {},
        "author_id": ObjectId(current_user["_id"]),
        "enhanced": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "published_at": None
    }
    res = content_items.insert_one(doc)

    # first revision
    content_revisions.insert_one({
        "content_id": res.inserted_id,
        "snapshot": {"title": doc["title"], "body": doc["body"], "tags": doc["tags"]},
        "created_at": datetime.utcnow(),
        "author_id": ObjectId(current_user["_id"])
    })

    return jsonify({"success": True, "content_id": str(res.inserted_id), "status": "draft"}), 201

# ---------- 2) upload media (simple local disk) ----------
@content_bp.route("/upload", methods=["POST"])
@token_required
def upload_media(current_user):
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error":"No file"}), 400
    os.makedirs("uploads/content", exist_ok=True)
    fname = datetime.utcnow().strftime("%Y%m%d_%H%M%S_") + file.filename.replace(" ", "_")
    path = os.path.join("uploads/content", fname)
    file.save(path)
    doc = {
        "author_id": ObjectId(current_user["_id"]),
        "filename": file.filename,
        "url": f"/uploads/content/{fname}",
        "size": os.path.getsize(path),
        "mime": file.mimetype,
        "created_at": datetime.utcnow()
    }
    mid = media_assets.insert_one(doc).inserted_id
    return jsonify({"success": True, "asset": {"id": str(mid), "url": doc["url"]}}), 201

# ---------- 3) submit for AI review ----------
@content_bp.route("/submit/<content_id>", methods=["POST"])
@token_required
def submit_for_review(current_user, content_id):
    doc = content_items.find_one({"_id": ObjectId(content_id)})
    if not doc: return jsonify({"error":"Not found"}), 404
    if str(doc["author_id"]) != current_user["_id"] and current_user.get("role")!="admin":
        return jsonify({"error":"Unauthorized"}), 403

    # call AI enhancement + moderation
    ai = enhance_and_moderate(doc["title"], doc["body"], tags=doc.get("tags", []), media=doc.get("media", []))
    # update item
    content_items.update_one(
        {"_id": doc["_id"]},
        {"$set":{
            "summary": ai.get("summary", doc.get("summary")),
            "body": ai.get("enhanced_body", doc["body"]),
            "themes": ai.get("themes", doc.get("themes", [])),
            "ai_flags": ai.get("flags", {}),
            "enhanced": True,
            "status": "in_review",
            "updated_at": datetime.utcnow()
        }}
    )
    # store job
    ai_moderation_jobs.insert_one({
        "content_id": doc["_id"],
        "result": ai,
        "created_at": datetime.utcnow()
    })
    return jsonify({"success": True, "status": "in_review", "ai_flags": ai.get("flags",{})})

# ---------- 4) admin/local self-publish (if safe) ----------
@content_bp.route("/publish/<content_id>", methods=["POST"])
@token_required
def publish_content(current_user, content_id):
    doc = content_items.find_one({"_id": ObjectId(content_id)})
    if not doc: return jsonify({"error":"Not found"}), 404

    # simple gate: block if safety==block or plagiarism high
    flags = doc.get("ai_flags", {})
    if flags.get("safety") == "block" or flags.get("plagiarism") == "high":
        return jsonify({"error": "AI flagged content. Requires admin override."}), 403

    if str(doc["author_id"]) != current_user["_id"] and current_user.get("role")!="admin":
        return jsonify({"error":"Unauthorized"}), 403

    content_items.update_one({"_id": doc["_id"]},
        {"$set":{"status":"published","published_at":datetime.utcnow(),"updated_at":datetime.utcnow()}})
    # optional: award XP to author
    users_collection.update_one({"_id": doc["author_id"]}, {"$inc":{"xp": 15}})
    return jsonify({"success": True, "status": "published"})

# ---------- 5) list my content ----------
@content_bp.route("/my", methods=["GET"])
@token_required
def my_content(current_user):
    items = list(content_items.find({"author_id": ObjectId(current_user["_id"])}).sort("created_at",-1))
    for i in items:
        i["_id"]=str(i["_id"])
        i["author_id"]=str(i["author_id"])
    return jsonify({"success": True, "count": len(items), "items": items})

# ---------- 6) discover nearby (public) ----------
@content_bp.route("/nearby", methods=["GET"])
def nearby_content():
    try:
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid lat/lng parameters"}), 400

    radius = int(request.args.get("radius", 1000))
    # search by circle (radians)
    items = list(content_items.find({
        "status":"published",
        "location": {"$geoWithin": {"$centerSphere": [[lng, lat], radius/6371000.0]}}
    }).limit(100))

    out=[]
    for c in items:
        glng, glat = c["location"]["coordinates"]
        dist = haversine_m(lat, lng, glat, glng)
        out.append({
            "id": str(c["_id"]),
            "type": c["type"],
            "title": c["title"],
            "summary": c.get("summary") or c["title"],
            "distance_m": round(dist,1),
            "radius_m": c["location"].get("radius_m",120),
            "unlock_mode": c.get("unlock_mode","geo")
        })
    return jsonify({"success": True, "count": len(out), "items": out})

# ---------- 7) geo unlock (traveler) ----------
@content_bp.route("/unlock/<content_id>", methods=["POST"])
@token_required
def unlock_content(current_user, content_id):
    c = content_items.find_one({"_id": ObjectId(content_id), "status":"published"})
    if not c: return jsonify({"error":"Not found or not published"}), 404

    data = request.get_json() or {}
    try:
        ulat = float(data.get("latitude"))
        ulng = float(data.get("longitude"))
    except (TypeError, ValueError):
         return jsonify({"error": "Invalid latitude/longitude in body"}), 400

    clng, clat = c["location"]["coordinates"]
    rr = c["location"].get("radius_m",120)

    if c.get("unlock_mode","geo") == "geo":
        dist = haversine_m(ulat, ulng, clat, clng)
        if dist > rr:
            return jsonify({"success": False, "error":"Too far", "distance_m": round(dist,1), "required_m": rr}), 403

    # already unlocked?
    if content_unlocks.find_one({"user_id": ObjectId(current_user["_id"]), "content_id": c["_id"]}):
        # allow re-fetch without extra XP
        return jsonify({"success": True, "content": {
            "id": str(c["_id"]),
            "title": c["title"],
            "type": c["type"],
            "body": c.get("body"),
            "summary": c.get("summary"),
            "media": c.get("media", []),
            "themes": c.get("themes", []),
            "tags": c.get("tags", []),
            "already_unlocked": True
        }})

    # log + award traveler XP, tiny boost to author too
    content_unlocks.insert_one({
        "user_id": ObjectId(current_user["_id"]),
        "content_id": c["_id"],
        "unlocked_at": datetime.utcnow(),
        "loc": {"lat": ulat, "lng": ulng}
    })
    users_collection.update_one({"_id": ObjectId(current_user["_id"])}, {"$inc":{"xp": 5}})
    users_collection.update_one({"_id": c["author_id"]}, {"$inc":{"xp": 2}})

    # return the content payload (enhanced body, media, themes)
    payload = {
        "id": str(c["_id"]),
        "title": c["title"],
        "type": c["type"],
        "body": c.get("body"),
        "summary": c.get("summary"),
        "media": c.get("media", []),
        "themes": c.get("themes", []),
        "tags": c.get("tags", [])
    }
    return jsonify({"success": True, "content": payload})
