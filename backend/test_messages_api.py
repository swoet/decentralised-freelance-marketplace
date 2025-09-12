#!/usr/bin/env python3
"""
Test script to verify messages API functionality
"""

import requests
import json
from uuid import uuid4

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_PROJECT_ID = str(uuid4())

def test_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/../test")
        print(f"✅ Backend health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_messages_endpoint():
    """Test messages endpoint without authentication"""
    try:
        # Test GET endpoint
        response = requests.get(f"{BASE_URL}/messages", params={"project_id": TEST_PROJECT_ID})
        print(f"📨 Messages GET endpoint: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Authentication required (expected)")
            return True
        elif response.status_code == 200:
            print("✅ Messages endpoint accessible")
            return True
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Messages endpoint test failed: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    try:
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
        }
        response = requests.options(f"{BASE_URL}/messages", headers=headers)
        print(f"🌐 CORS preflight check: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print("CORS Headers:")
        for key, value in cors_headers.items():
            print(f"  {key}: {value}")
            
        return response.status_code in [200, 204]
        
    except Exception as e:
        print(f"❌ CORS test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Backend Messages API")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_health),
        ("Messages Endpoint", test_messages_endpoint),
        ("CORS Configuration", test_cors),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n🔍 Testing {name}...")
        result = test_func()
        results.append((name, result))
        print("")
    
    print("=" * 50)
    print("📊 Test Results:")
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
    
    all_passed = all(result for _, result in results)
    if all_passed:
        print("\n🎉 All tests passed! Messages API should work.")
    else:
        print("\n⚠️ Some tests failed. Check the issues above.")
