from db import db
import pprint

print("--- Quests Collection Inspection ---")
count = db.quests.count_documents({})
print(f"Total quests: {count}")

active_count = db.quests.count_documents({'active': True})
print(f"Active quests: {active_count}")

print("\n--- Sample Quest ---")
sample = db.quests.find_one()
if sample:
    # Convert ObjectId to str for printing
    sample['_id'] = str(sample['_id'])
    if 'local_id' in sample:
        sample['local_id'] = str(sample['local_id'])
    pprint.pprint(sample)
else:
    print("No quests found in DB.")
