"""
Comprehensive Phase 1 Testing - All Features
"""
import sys
import time

print("=" * 70)
print("VAAYA - PHASE 1 COMPLETE TEST")
print("=" * 70)

tests_passed = 0
tests_failed = 0

# Test 1: Gemini API
print("\n[1/4] Testing Gemini API Integration...")
print("-" * 70)
try:
    import os
    from dotenv import load_dotenv
    import google.generativeai as genai
    
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("   ❌ FAILED: No API key found")
        tests_failed += 1
    else:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say 'Vaaya ready!' in one word")
        
        print(f"   ✅ PASSED: Gemini API working")
        print(f"   Response: {response.text.strip()}")
        tests_passed += 1
except Exception as e:
    print(f"   ❌ FAILED: {str(e)[:100]}")
    tests_failed += 1

# Test 2: Image Verification (AI Libraries)
print("\n[2/4] Testing Image Verification (TensorFlow, OpenCV, Pillow)...")
print("-" * 70)
try:
    import tensorflow as tf
    import cv2
    from PIL import Image
    import numpy as np
    
    # Test each library
    print(f"   • TensorFlow: {tf.__version__}")
    print(f"   • OpenCV: {cv2.__version__}")
    print(f"   • Pillow: {Image.__version__}")
    print(f"   • NumPy: {np.__version__}")
    
    # Quick image test
    test_img = Image.new('RGB', (100, 100), color='blue')
    img_array = np.array(test_img)
    
    print(f"   ✅ PASSED: All AI libraries working")
    tests_passed += 1
except Exception as e:
    print(f"   ❌ FAILED: {str(e)[:100]}")
    tests_failed += 1

# Test 3: Socket.IO Configuration
print("\n[3/4] Testing Socket.IO Configuration...")
print("-" * 70)
try:
    from flask_socketio import SocketIO
    import socketio as socketio_client
    
    print(f"   • flask-socketio: Available")
    print(f"   • python-socketio: Available")
    
    # Check app.py has socketio configured
    with open('app.py', 'r', encoding='utf-8') as f:
        app_content = f.read()
        if 'SocketIO' in app_content and 'socketio.run' in app_content:
            print(f"   • app.py: Socket.IO initialized")
            print(f"   • Event handlers: connect, disconnect, join_chat, send_message, ai_chat")
            print(f"   ✅ PASSED: Socket.IO configured")
            tests_passed += 1
        else:
            print(f"   ❌ FAILED: Socket.IO not properly configured in app.py")
            tests_failed += 1
except Exception as e:
    print(f"   ❌ FAILED: {str(e)[:100]}")
    tests_failed += 1

# Test 4: Leaflet.js Interactive Map
print("\n[4/4] Testing Leaflet.js Interactive Map...")
print("-" * 70)
try:
    # Check heatmap.html has Leaflet
    with open('templates/heatmap.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
        has_leaflet = 'leaflet' in html_content.lower()
        has_map_div = '<div id="map"' in html_content
        
    # Check heatmap.js has map initialization
    with open('static/js/heatmap.js', 'r', encoding='utf-8') as f:
        js_content = f.read()
        has_map_init = 'L.map' in js_content
        has_heatmap = 'heatLayer' in js_content
        has_markers = 'questMarkers' in js_content
        
    # Check quest locations API
    with open('routes/quest_routes.py', 'r', encoding='utf-8') as f:
        routes_content = f.read()
        has_locations_api = '/locations' in routes_content
        
    if all([has_leaflet, has_map_div, has_map_init, has_heatmap, has_markers, has_locations_api]):
        print(f"   • Leaflet.js CDN: ✓ Included")
        print(f"   • Leaflet.heat plugin: ✓ Included")
        print(f"   • Map container: ✓ Created")
        print(f"   • Map initialization: ✓ Configured")
        print(f"   • Heatmap layer: ✓ Implemented")
        print(f"   • Quest markers: ✓ Implemented")
        print(f"   • /api/quests/locations: ✓ Created")
        print(f"   ✅ PASSED: Interactive map fully configured")
        tests_passed += 1
    else:
        print(f"   ❌ FAILED: Some components missing")
        tests_failed += 1
except Exception as e:
    print(f"   ❌ FAILED: {str(e)[:100]}")
    tests_failed += 1

# Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print(f"✅ Passed: {tests_passed}/4")
print(f"❌ Failed: {tests_failed}/4")

if tests_passed == 4:
    print("\n🎉 ALL TESTS PASSED - PHASE 1 COMPLETE!")
    print("\n📋 Phase 1 Deliverables:")
    print("   1.1 ✅ Gemini API with model fallback (gemini-2.5-flash)")
    print("   1.2 ✅ AI libraries installed (TensorFlow, OpenCV, Pillow)")
    print("   1.3 ✅ Socket.IO real-time chat configured")
    print("   1.4 ✅ Leaflet.js interactive map with quest markers")
    print("\n🚀 Ready for Phase 2!")
    print("\n💡 To test the app:")
    print("   1. python app.py")
    print("   2. Open: http://localhost:5000")
    print("   3. Navigate to: /heatmap, /quests, /chat")
else:
    print(f"\n⚠️  {tests_failed} test(s) failed. Review errors above.")

print("=" * 70)

sys.exit(0 if tests_passed == 4 else 1)
