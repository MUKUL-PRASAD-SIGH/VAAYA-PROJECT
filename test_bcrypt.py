import bcrypt

# Test bcrypt directly
password = "test123"
print(f"Original password: {password}")

# Hash the password
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(f"Hashed password: {hashed}")

# Verify the password
result = bcrypt.checkpw(password.encode('utf-8'), hashed)
print(f"Verification result: {result}")

# Test with wrong password
wrong_result = bcrypt.checkpw("wrong".encode('utf-8'), hashed)
print(f"Wrong password result: {wrong_result}")

# Now test with a real user from database
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))
db = client['vaaya']
users_collection = db['users']

# Find a recent user
user = users_collection.find_one({}, sort=[('_id', -1)])
if user:
    print(f"\n--- Testing with real user ---")
    print(f"Email: {user.get('email')}")
    print(f"Password hash type: {type(user.get('password_hash'))}")
    print(f"Password hash length: {len(user.get('password_hash'))}")
    
    # Try to verify with a test password
    test_pass = "test123"
    stored_hash = user.get('password_hash')
    
    # Make sure stored_hash is bytes
    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode('utf-8')
    
    try:
        verify_result = bcrypt.checkpw(test_pass.encode('utf-8'), stored_hash)
        print(f"Verification with '{test_pass}': {verify_result}")
    except Exception as e:
        print(f"Error verifying: {e}")
else:
    print("No users found in database")
