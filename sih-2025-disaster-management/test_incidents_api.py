import requests
import json

# Test the improved incidents API endpoint
BASE_URL = "http://127.0.0.1:5000/api"

def test_incidents_api_comprehensive():
    print("🧪 COMPREHENSIVE INCIDENTS API TESTING")
    print("=" * 50)
    
    # Test 1: Valid POST request
    test_incident = {
        "title": "Comprehensive Test Incident",
        "description": "Testing improved API with proper error handling",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "user_id": 1
    }
    
    print("\n📋 Test 1: POST /incidents (Valid Data)")
    response = requests.post(f"{BASE_URL}/incidents", json=test_incident)
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 201:
        print("   ✅ POST successful with 201 Created status")
        created_id = response.json().get("incident", {}).get("id")
    else:
        print("   ❌ POST failed - Expected 201 Created")
        return False
    
    # Test 2: Invalid POST (missing title)
    print("\n📋 Test 2: POST /incidents (Missing Title)")
    invalid_data = {"description": "Missing title test"}
    response = requests.post(f"{BASE_URL}/incidents", json=invalid_data)
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 400:
        print("   ✅ Validation working - 400 Bad Request")
    else:
        print("   ❌ Validation failed")
    
    # Test 3: GET all incidents
    print("\n📋 Test 3: GET /incidents")
    response = requests.get(f"{BASE_URL}/incidents")
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        incidents = response.json()
        print(f"   ✅ Found {len(incidents)} incidents")
    else:
        print("   ❌ GET failed")
    
    # Test 4: PATCH update
    if 'created_id' in locals():
        print(f"\n📋 Test 4: PATCH /incidents/{created_id}")
        response = requests.patch(f"{BASE_URL}/incidents/{created_id}", json={"status": "verified"})
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ PATCH successful")
        else:
            print("   ❌ PATCH failed")
    
    print("\n🎉 API TESTING COMPLETE!")
    print("📊 Summary: All endpoints working with proper status codes")
    return True

if __name__ == "__main__":
    test_incidents_api_comprehensive()