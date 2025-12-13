from db import db

print("--- Activating All Quests ---")
result = db.quests.update_many(
    {}, 
    {'$set': {'active': True}}
)
print(f"Matched: {result.matched_count}, Modified: {result.modified_count}")
print("All quests are now active.")
