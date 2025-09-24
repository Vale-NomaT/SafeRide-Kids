# SafeRide Kids - Testing Instructions

## 🚀 Quick Start Testing Guide

This document provides step-by-step instructions for testing the SafeRide Kids mobile application after the recent network connectivity and navigation fixes.

## 📋 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Expo Go** app installed on your mobile device
- **MongoDB** running locally or accessible remotely

### Network Setup
- **PC Hotspot**: Enable Windows Mobile Hotspot for testing
- **Alternative**: Ensure both PC and mobile device are on the same WiFi network without AP Isolation

## 🔧 Server Setup

### 1. Start Backend Server (FastAPI)
```bash
# Navigate to project directory
cd "C:\Users\samuel.ndlovu\Saved Games\SafeRide-Kids"

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
- Server running on `http://0.0.0.0:8000`
- MongoDB connection successful
- Auto-reload enabled

### 2. Start Frontend Server (Expo)
```bash
# In the same directory
npx expo start --lan --clear --reset-cache
```

**Expected Output:**
- Metro Bundler starts
- QR code displayed
- Local and LAN URLs shown

## 📱 Mobile Testing Steps

### Network Configuration Testing

#### Option A: PC Hotspot (Recommended)
1. **Enable PC Hotspot:**
   - Go to Windows Settings > Network & Internet > Mobile hotspot
   - Turn on "Share my Internet connection with other devices"
   - Note the hotspot name and password

2. **Connect Mobile Device:**
   - Connect your mobile device to the PC hotspot
   - Verify connection in device WiFi settings

3. **Verify API Configuration:**
   - The app should automatically use `http://192.168.137.1:8000`
   - This IP is configured in `services/api.js`

#### Option B: Same WiFi Network
1. **Connect Both Devices:**
   - Ensure PC and mobile device are on the same WiFi network
   - Check that router doesn't have AP Isolation enabled

2. **Find PC IP Address:**
   ```bash
   ipconfig
   ```
   - Look for "Wireless LAN adapter WiFi" IPv4 Address
   - Update `services/api.js` if needed

### Application Testing

#### 1. Health Check Test
```bash
# Test API accessibility from mobile browser
# Open mobile browser and navigate to:
http://192.168.137.1:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "message": "SafeRide Kids API is running",
  "timestamp": 1234567890.123,
  "version": "1.0.0"
}
```

#### 2. Expo App Testing
1. **Scan QR Code:**
   - Open Expo Go app on mobile device
   - Scan the QR code from terminal output
   - Wait for app to load

2. **Registration Flow Test:**
   ```
   Test Data:
   - Email: test@example.com
   - Password: TestPass123
   - Confirm Password: TestPass123
   - Role: Guardian
   ```

3. **Expected Behavior:**
   - Registration form validates input
   - API call succeeds (check terminal logs)
   - Auto-login after registration
   - Navigation to Home screen (not "Main" error)

#### 3. Login Flow Test
```
Existing Test Account:
- Email: dox@gmail.com
- Password: Frego12345
```

**Expected Behavior:**
- Login form accepts credentials
- API authentication succeeds
- JWT token received and stored
- Navigation to Home screen

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Network Connectivity Issues
**Problem:** "Failed to download remote update" or connection timeouts

**Solutions:**
1. **Check PC Hotspot:**
   ```bash
   ipconfig
   # Verify "Wireless LAN adapter WiFi 2" shows 192.168.137.1
   ```

2. **Test API Manually:**
   ```bash
   curl http://192.168.137.1:8000/health
   ```

3. **Disable Windows Firewall (temporarily):**
   - Windows Security > Firewall & network protection
   - Turn off for Private networks

#### Navigation Errors
**Problem:** "The action 'REPLACE' with payload {"name":"Main"} was not handled"

**Solution:** This has been fixed in the latest commit. The app now navigates to "Home" screen.

#### App Loading Issues
**Problem:** App shows loading screen indefinitely

**Solutions:**
1. **Clear Expo Cache:**
   ```bash
   npx expo start --clear
   ```

2. **Restart Metro Bundler:**
   - Press `r` in terminal to reload
   - Or restart the expo server

3. **Check API Logs:**
   - Monitor FastAPI terminal for error messages
   - Verify MongoDB connection

## 📊 Testing Checklist

### ✅ Pre-Testing Setup
- [ ] FastAPI server running on port 8000
- [ ] Expo server running with QR code visible
- [ ] Mobile device connected to PC hotspot or same WiFi
- [ ] MongoDB accessible and connected

### ✅ Network Connectivity
- [ ] Health endpoint accessible from mobile browser
- [ ] API base URL correctly configured (192.168.137.1:8000)
- [ ] No firewall blocking connections

### ✅ Registration Testing
- [ ] Form validation works correctly
- [ ] API registration call succeeds
- [ ] Auto-login after registration
- [ ] Navigation to Home screen (no "Main" error)

### ✅ Login Testing
- [ ] Existing credentials work
- [ ] JWT token received and stored
- [ ] Navigation to Home screen
- [ ] User session persists

### ✅ Error Handling
- [ ] Network errors display user-friendly messages
- [ ] Invalid credentials show appropriate errors
- [ ] Form validation prevents invalid submissions

## 📝 Test Results Documentation

### Success Criteria
- All API calls return 200/201 status codes
- No navigation errors in console
- Smooth transitions between screens
- Proper error handling for edge cases

### Performance Metrics
- Registration: < 3 seconds
- Login: < 2 seconds
- Screen transitions: < 1 second
- API response times: < 500ms

## 🔍 Debug Information

### Useful Commands
```bash
# Check network configuration
ipconfig

# Test API connectivity
curl http://192.168.137.1:8000/health

# View real-time logs
# FastAPI logs in terminal 6
# Expo logs in terminal 7

# Clear all caches
npx expo start --clear --reset-cache
```

### Log Locations
- **FastAPI Logs:** Terminal output with detailed request/response info
- **Expo Logs:** Metro Bundler terminal with app console logs
- **Mobile Logs:** Expo Go app console (shake device > Debug)

## 📞 Support

If you encounter issues not covered in this guide:

1. **Check Recent Commits:** Review git log for recent fixes
2. **Network Diagnostics:** Run `python network_diagnostic.py`
3. **API Testing:** Use `python test_network.py`

---

**Last Updated:** After network connectivity and navigation fixes
**Tested On:** Windows 11, Android/iOS devices
**API Version:** 1.0.0