from db import db
import json
from bson import json_util

print("--- Exporting Quest Locations ---")
quests = list(db.quests.find({}, {'location': 1, '_id': 0}))

output_file = 'quest_locations.json'
with open(output_file, 'w') as f:
    json.dump(quests, f, default=json_util.default, indent=4)

print(f"Exported {len(quests)} locations to {output_file}")
