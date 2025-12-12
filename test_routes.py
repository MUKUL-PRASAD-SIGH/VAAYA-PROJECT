#!/usr/bin/env python
"""Test script to check route registration"""
from app import app

print("\n=== Testing Route Registration ===\n")

print("All registered routes:")
for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
    if '/api/' in rule.rule or rule.rule == '/api':
        print(f"  {rule.rule:50} -> {rule.endpoint}")

print("\n=== Testing /api/quests endpoint ===\n")

with app.test_client() as client:
    # Test different quest endpoints
    endpoints = [
        '/api/quests',
        '/api/quests/',
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        print(f"{endpoint:30} Status: {response.status_code}")
        if response.status_code == 200:
            print(f"{'':30} Data: {response.get_json()}")
        else:
            print(f"{'':30} Error: {response.data.decode()[:100]}")

print("\n=== Done ===\n")
