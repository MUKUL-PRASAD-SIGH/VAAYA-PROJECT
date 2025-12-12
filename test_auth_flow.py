#!/usr/bin/env python
"""Test registration and login"""
import requests
import sys

API = "http://localhost:5000"

# Register
print("Registering new user...")
reg_data = {
    "email": "quicktest@example.com",
    "password": "TestPass123!",
    "name": "Quick Test",
    "role": "tourist"
}

reg_response = requests.post(f"{API}/auth/register", json=reg_data)
print(f"Registration Status: {reg_response.status_code}")
print(f"Registration Response: {reg_response.json()}")

if reg_response.status_code == 201:
    print("\n" + "="*50)
    print("Now testing login with SAME credentials...")
    print("="*50 + "\n")
    
    # Login
    login_data = {
        "email": "quicktest@example.com",
        "password": "TestPass123!"
    }
    
    login_response = requests.post(f"{API}/auth/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    print(f"Login Response: {login_response.json()}")
    
    if login_response.status_code == 200:
        print("\n✅ SUCCESS! Registration and Login both work!")
    else:
        print("\n❌ FAILED! Login did not work")
        sys.exit(1)
else:
    print(f"Registration failed - might already exist, trying login anyway...")
    login_data = {
        "email": "quicktest@example.com",
        "password": "TestPass123!"
    }
    login_response = requests.post(f"{API}/auth/login", json=login_data)
    print(f"Login Status: {login_response.status_code}")
    print(f"Login Response: {login_response.json()}")
