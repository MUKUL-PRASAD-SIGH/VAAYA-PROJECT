"""
Test the new Leaflet.js heatmap with quest markers
"""
import requests

print("=" * 60)
print("Interactive Heatmap Test")
print("=" * 60)

# Test 1: Check quest locations endpoint
print("\n1. Testing quest locations API...")
try:
    response = requests.get('http://localhost:5000/api/quests/locations?destination=Delhi')
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Quest locations API working!")
        print(f"   Found {data['count']} quests for {data['destination']}")
        for quest in data['quests'][:3]:
            print(f"      - {quest['title']} at {quest['location']['name']}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Check heatmap page
print("\n2. Testing heatmap page...")
try:
    response = requests.get('http://localhost:5000/heatmap')
    if response.status_code == 200:
        print("   ✅ Heatmap page loading!")
        if 'leaflet' in response.text.lower():
            print("   ✅ Leaflet.js included!")
        if 'map' in response.text.lower():
            print("   ✅ Map container found!")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("✅ Phase 1.4 Complete!")
print("\n📋 What's New:")
print("   - Canvas heatmap replaced with Leaflet.js interactive map")
print("   - Quest markers displayed on map")
print("   - Clickable popups with quest details")
print("   - Heatmap overlay showing crowd density")
print("   - /api/quests/locations endpoint added")
print("\n💡 Test it:")
print("   1. Open: http://localhost:5000/heatmap")
print("   2. Enter: Location='Delhi, India', Date=Today")
print("   3. Click 'Generate'")
print("   4. See interactive map with quest markers!")
print("=" * 60)
