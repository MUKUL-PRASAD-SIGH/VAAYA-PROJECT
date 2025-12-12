import db
from datetime import datetime

demo_quests = [
    {
        "title": "Clean Cups Outside CSE Lab 3",
        "description": "Collect and properly dispose of disposable cups scattered outside CSE Lab 3. Take before and after photos for verification!",
        "location_name": "CSE Lab 3, Ramaiah Institute of Technology",
        "points": 50,
        "difficulty": "Easy",
        "category": "environment",
        "requirements": [
            "Take before image showing trash",
            "Clean up all visible waste",
            "Take after image showing area clean",
            "Dispose trash responsibly"
        ],
        "created_at": datetime.utcnow()
    },
    {
        "title": "Beach Cleanup at Malpe",
        "description": "Participate in a beach clean-up and help preserve marine life.",
        "location_name": "Malpe Beach, Udupi",
        "points": 100,
        "difficulty": "Medium",
        "category": "environment",
        "requirements": [
            "Take before and after photos",
            "Submit proof of waste collection",
            "Show proper disposal"
        ],
        "created_at": datetime.utcnow()
    },
    {
        "title": "Park Cleanup Drive",
        "description": "Join the Cubbon Park cleanup to make it greener and cleaner!",
        "location_name": "Cubbon Park, Bangalore",
        "points": 75,
        "difficulty": "Medium",
        "category": "environment",
        "requirements": [
            "Capture photos during the cleanup",
            "Dispose collected waste responsibly"
        ],
        "created_at": datetime.utcnow()
    }
]

db.quests.insert_many(demo_quests)
print("✅ Demo quests inserted successfully!")
