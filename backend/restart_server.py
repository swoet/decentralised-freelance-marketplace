#!/usr/bin/env python3
"""
Script to restart the FastAPI backend server
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def kill_existing_servers():
    """Kill any existing Python servers"""
    try:
        # Kill any Python processes that might be running the server
        if os.name == 'nt':  # Windows
            subprocess.run(['taskkill', '/f', '/im', 'python.exe'], capture_output=True)
        else:  # Unix/Linux
            subprocess.run(['pkill', '-f', 'uvicorn'], capture_output=True)
        
        print("🔄 Stopped existing servers")
        time.sleep(2)
    except Exception as e:
        print(f"⚠️ Error stopping servers: {e}")

def start_server():
    """Start the FastAPI server"""
    try:
        print("🚀 Starting FastAPI server...")
        
        # Change to backend directory
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        # Start the server
        process = subprocess.Popen([
            sys.executable, '-m', 'uvicorn', 
            'app.main:app', 
            '--host', '0.0.0.0', 
            '--port', '8000', 
            '--reload'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("⏳ Waiting for server to start...")
        time.sleep(5)
        
        # Test if server is running
        try:
            response = requests.get('http://localhost:8000/', timeout=10)
            if response.status_code == 200:
                print("✅ Server started successfully!")
                print("🌐 Server running at: http://localhost:8000")
                print("📚 API docs at: http://localhost:8000/docs")
                print("💬 Messages API: http://localhost:8000/api/v1/messages")
                return True
        except requests.exceptions.RequestException:
            print("❌ Server failed to start properly")
            return False
            
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def test_endpoints():
    """Test key endpoints"""
    print("\n🧪 Testing key endpoints...")
    
    endpoints = [
        ("Health", "http://localhost:8000/"),
        ("API Health", "http://localhost:8000/test"),
        ("Messages (no auth)", "http://localhost:8000/api/v1/messages?project_id=test"),
        ("Auth Login", "http://localhost:8000/api/v1/auth/login"),
    ]
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code in [200, 401, 422]:  # Expected status codes
                print(f"  ✅ {name}: {response.status_code}")
            else:
                print(f"  ⚠️ {name}: {response.status_code}")
        except Exception as e:
            print(f"  ❌ {name}: Failed ({e})")

if __name__ == "__main__":
    print("🔄 Restarting FreelanceX Backend Server")
    print("=" * 50)
    
    # Kill existing servers
    kill_existing_servers()
    
    # Start new server
    if start_server():
        test_endpoints()
        print("\n🎉 Backend server restarted successfully!")
        print("\n📝 What's fixed:")
        print("  • CORS configuration for frontend (port 3000) and admin (port 3001)")
        print("  • Messages API for project chat")
        print("  • Geolocation permissions policy")
        print("  • Authentication endpoints")
        
        print("\n⚡ Server will continue running...")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Stopping server...")
    else:
        print("\n❌ Failed to restart server. Check the logs above.")
        sys.exit(1)
