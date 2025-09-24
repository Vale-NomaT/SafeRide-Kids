#!/usr/bin/env python3
"""
Network connectivity test script for SafeRide Kids API
Tests connectivity to the API from different network interfaces
"""

import requests
import socket
import subprocess
import sys
import time
from urllib.parse import urlparse

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote server to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"❌ Error getting local IP: {e}")
        return None

def test_port_connectivity(host, port):
    """Test if a port is open on a host"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        print(f"❌ Error testing port {port} on {host}: {e}")
        return False

def test_http_endpoint(url, timeout=10):
    """Test HTTP endpoint connectivity"""
    try:
        print(f"🔍 Testing: {url}")
        response = requests.get(url, timeout=timeout)
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {response.text[:200]}...")
        return True
    except requests.exceptions.ConnectTimeout:
        print(f"❌ Connection timeout to {url}")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error to {url}: {e}")
        return False
    except Exception as e:
        print(f"❌ Error testing {url}: {e}")
        return False

def ping_host(host):
    """Ping a host to test basic connectivity"""
    try:
        # Use ping command (works on both Windows and Unix)
        if sys.platform.startswith('win'):
            result = subprocess.run(['ping', '-n', '1', host], 
                                  capture_output=True, text=True, timeout=10)
        else:
            result = subprocess.run(['ping', '-c', '1', host], 
                                  capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print(f"✅ Ping to {host} successful")
            return True
        else:
            print(f"❌ Ping to {host} failed")
            return False
    except Exception as e:
        print(f"❌ Error pinging {host}: {e}")
        return False

def main():
    print("🚀 SafeRide Kids API Network Connectivity Test")
    print("=" * 50)
    
    # Get local IP
    local_ip = get_local_ip()
    print(f"🌐 Local IP Address: {local_ip}")
    
    # Test URLs
    test_urls = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    if local_ip:
        test_urls.append(f"http://{local_ip}:8000")
    
    # Add the mobile IP that's configured
    test_urls.append("http://10.100.0.222:8000")
    
    print("\n📡 Testing Basic Connectivity")
    print("-" * 30)
    
    # Test ping connectivity
    hosts_to_ping = ["localhost", "127.0.0.1"]
    if local_ip:
        hosts_to_ping.append(local_ip)
    hosts_to_ping.append("10.100.0.222")
    
    for host in hosts_to_ping:
        ping_host(host)
    
    print("\n🔌 Testing Port Connectivity")
    print("-" * 30)
    
    # Test port connectivity
    for url in test_urls:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or 80
        is_open = test_port_connectivity(host, port)
        print(f"{'✅' if is_open else '❌'} Port {port} on {host}: {'OPEN' if is_open else 'CLOSED'}")
    
    print("\n🌐 Testing HTTP Endpoints")
    print("-" * 30)
    
    # Test HTTP endpoints
    for url in test_urls:
        print(f"\n🔍 Testing base URL: {url}")
        test_http_endpoint(url)
        
        print(f"🔍 Testing health endpoint: {url}/health")
        test_http_endpoint(f"{url}/health")
        
        print(f"🔍 Testing docs endpoint: {url}/docs")
        test_http_endpoint(f"{url}/docs")
    
    print("\n🔥 Testing Firewall and Network Configuration")
    print("-" * 30)
    
    # Check if Windows Firewall might be blocking
    if sys.platform.startswith('win'):
        print("💡 Windows Firewall Check:")
        print("   - Check Windows Defender Firewall settings")
        print("   - Ensure Python/uvicorn is allowed through firewall")
        print("   - Try temporarily disabling firewall for testing")
    
    print("\n💡 Troubleshooting Tips:")
    print("   1. Ensure the FastAPI server is running on 0.0.0.0:8000")
    print("   2. Check if antivirus software is blocking connections")
    print("   3. Verify mobile device is on the same network")
    print("   4. Try accessing from web browser first")
    print("   5. Check router/network configuration")
    
    print("\n✅ Network connectivity test completed!")

if __name__ == "__main__":
    main()