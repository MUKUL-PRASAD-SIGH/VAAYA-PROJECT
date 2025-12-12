"""
Quick test script for QuestLoop authentication API
Tests tourist signup, local signup, login, and OTP flow
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_tourist_signup():
    """Test tourist signup"""
    print("\n=== Testing Tourist Signup ===")
    
    data = {
        "email": "tourist@test.com",
        "password": "test1234",
        "name": "Test Tourist"
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup/tourist", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        return response.json().get('token')
    return None

def test_local_signup():
    """Test local guide signup"""
    print("\n=== Testing Local Signup ===")
    
    data = {
        "email": "local@test.com",
        "password": "test1234",
        "name": "Test Local",
        "phone": "+1234567890",
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup/local", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 201:
        return response.json().get('token')
    return None

def test_login(email, password):
    """Test login"""
    print(f"\n=== Testing Login ({email}) ===")
    
    data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        return response.json().get('token')
    return None

def test_protected_route(token):
    """Test protected route"""
    print("\n=== Testing Protected Route ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/protected/test", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_profile(token):
    """Test get profile"""
    print("\n=== Testing Get Profile ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_request_otp(token, phone):
    """Test OTP request"""
    print("\n=== Testing OTP Request ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    data = {
        "phone": phone
    }
    
    response = requests.post(f"{BASE_URL}/auth/otp/request", json=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Check ===")
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_home():
    """Test home endpoint"""
    print("\n=== Testing Home Endpoint ===")
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    print("=" * 60)
    print("Vaaya API Tests")
    print("=" * 60)
    
    # Test health and home
    test_health()
    test_home()
    
    # Test tourist flow
    tourist_token = test_tourist_signup()
    if tourist_token:
        test_protected_route(tourist_token)
        test_profile(tourist_token)
    
    # Test local flow
    local_token = test_local_signup()
    if local_token:
        test_protected_route(local_token)
        test_profile(local_token)
        test_request_otp(local_token, "+1234567890")
    
    # Test login
    if tourist_token:
        test_login("tourist@test.com", "test1234")
    
    print("\n" + "=" * 60)
    print("Tests Complete!")
    print("=" * 60)
