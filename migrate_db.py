from db import db
from pymongo import GEOSPHERE

print("--- Migrating Quest Coordinates ---")

# 1. Update existing records with dict coordinates to list [lng, lat]
quests = db.quests.find({})
count = 0

for q in quests:
    loc = q.get('location', {})
    coords = loc.get('coordinates')
    
    if isinstance(coords, dict):
        new_coords = [coords.get('lng', 0), coords.get('lat', 0)]
        db.quests.update_one(
            {'_id': q['_id']},
            {'$set': {'location.coordinates': new_coords}}
        )
        print(f"Updated quest {q.get('title')} to {new_coords}")
        count += 1

print(f"Migrated {count} quests.")

# 2. Ensure 2dsphere index exists
print("Creating 2dsphere index...")
db.quests.create_index([("location", GEOSPHERE)])
print("Index created/ensured.")
