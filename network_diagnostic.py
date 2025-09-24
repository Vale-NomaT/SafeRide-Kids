#!/usr/bin/env python3
"""
Network Diagnostic Script for SafeRide Kids Mobile Connectivity
This script helps diagnose network connectivity issues between mobile devices and the PC.
"""

import socket
import subprocess
import platform
import requests
import time
from datetime import datetime

def get_local_ip():
    """Get the local IP address of this machine."""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception as e:
        print(f"❌ Error getting local IP: {e}")
        return None

def test_port_open(host, port):
    """Test if a port is open on the given host."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(5)
            result = sock.connect_ex((host, port))
            return result == 0
    except Exception as e:
        print(f"❌ Error testing port {port}: {e}")
        return False

def test_api_endpoint(base_url):
    """Test API endpoints."""
    endpoints = [
        "/health",
        "/",
        "/docs"
    ]
    
    results = {}
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=10)
            results[endpoint] = {
                "status": response.status_code,
                "success": response.status_code == 200,
                "response_time": response.elapsed.total_seconds()
            }
            print(f"✅ {endpoint}: {response.status_code} ({response.elapsed.total_seconds():.3f}s)")
        except requests.exceptions.RequestException as e:
            results[endpoint] = {
                "status": None,
                "success": False,
                "error": str(e)
            }
            print(f"❌ {endpoint}: {e}")
    
    return results

def check_firewall_rules():
    """Check Windows Firewall rules for port 8000."""
    try:
        if platform.system() == "Windows":
            result = subprocess.run([
                "netsh", "advfirewall", "firewall", "show", "rule", "name=all"
            ], capture_output=True, text=True, timeout=30)
            
            if "8000" in result.stdout:
                print("✅ Found firewall rules mentioning port 8000")
                # Extract relevant lines
                lines = result.stdout.split('\n')
                for i, line in enumerate(lines):
                    if "8000" in line:
                        # Print context around the match
                        start = max(0, i-3)
                        end = min(len(lines), i+4)
                        print("📋 Firewall rule context:")
                        for j in range(start, end):
                            marker = ">>> " if j == i else "    "
                            print(f"{marker}{lines[j]}")
                        break
            else:
                print("⚠️  No specific firewall rules found for port 8000")
        else:
            print("ℹ️  Firewall check only available on Windows")
    except Exception as e:
        print(f"❌ Error checking firewall: {e}")

def main():
    print("🔍 SafeRide Kids Network Diagnostic")
    print("=" * 50)
    print(f"🕐 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get local IP
    local_ip = get_local_ip()
    if local_ip:
        print(f"🌐 Local IP Address: {local_ip}")
    else:
        print("❌ Could not determine local IP address")
        return
    
    print()
    
    # Test port connectivity
    print("🔌 Testing Port Connectivity:")
    port_8000_open = test_port_open(local_ip, 8000)
    port_8081_open = test_port_open(local_ip, 8081)
    
    print(f"   Port 8000 (API): {'✅ Open' if port_8000_open else '❌ Closed'}")
    print(f"   Port 8081 (Expo): {'✅ Open' if port_8081_open else '❌ Closed'}")
    print()
    
    # Test API endpoints
    if port_8000_open:
        print("🌐 Testing API Endpoints:")
        api_base_url = f"http://{local_ip}:8000"
        test_api_endpoint(api_base_url)
        print()
    
    # Check firewall
    print("🔥 Checking Firewall Rules:")
    check_firewall_rules()
    print()
    
    # Network troubleshooting tips
    print("🛠️  Mobile Connectivity Troubleshooting:")
    print("   1. Ensure your mobile device is connected to the same WiFi network")
    print("   2. Try pinging this PC from your mobile device (if possible)")
    print(f"   3. Try accessing http://{local_ip}:8000/health in mobile browser")
    print("   4. Check if your router has AP isolation enabled (disable it)")
    print("   5. Temporarily disable Windows Firewall to test")
    print("   6. Check if antivirus software is blocking connections")
    print()
    
    print("📱 Mobile Testing URLs:")
    print(f"   API Health: http://{local_ip}:8000/health")
    print(f"   API Docs: http://{local_ip}:8000/docs")
    print(f"   Expo Web: http://{local_ip}:8081")
    print()
    
    print("🔄 To test from mobile:")
    print("   1. Open mobile browser")
    print(f"   2. Navigate to: http://{local_ip}:8000/health")
    print("   3. You should see: {\"status\":\"healthy\",...}")

if __name__ == "__main__":
    main()