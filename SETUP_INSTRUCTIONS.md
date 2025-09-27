# SafeRide Kids Guardian App - Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- React Native development environment
- Your backend API running on port 8001

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Update API Configuration**
   - Open `services/api.js`
   - Replace `192.168.1.100` with your actual local IP address
   - To find your IP:
     - Windows: Run `ipconfig` in Command Prompt
     - Mac/Linux: Run `ifconfig` in Terminal
   - Update the line: `const API_BASE_URL = 'http://YOUR_LOCAL_IP:8001';`

3. **Start the Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

4. **Run on Device/Simulator**
   - For Android: `npm run android` or scan QR code with Expo Go app
   - For iOS: `npm run ios` or scan QR code with Expo Go app

## Testing the Authentication Flow

### Test Flow:
1. **Open app** → See Login screen
2. **Tap "Don't have account?"** → Navigate to Signup
3. **Sign up as guardian** → Should auto-login → Navigate to Home
4. **Tap "Add Child"** → Opens AddChildScreen → Test map pickers → Save child to DB

### Test Credentials:
You can create test accounts through the signup flow, or use existing accounts if you have them in your backend.

## App Structure

```
SafeRide-Kids/
├── App.js                 # Root component with NavigationContainer
├── package.json           # Dependencies and scripts
├── services/
│   └── api.js            # API calls and token management
├── navigation/
│   └── AppNavigator.js   # Stack Navigator configuration
└── screens/
    ├── LoginScreen.js    # Email/password login
    ├── SignupScreen.js   # Registration with auto-login
    ├── HomeScreen.js     # Dashboard with navigation buttons
    └── AddChildScreen.js # Child registration (existing)
```

## Features Implemented

✅ **Authentication System**
- Login with email/password
- Registration with auto-login
- Token storage with AsyncStorage
- Logout functionality

✅ **Navigation**
- Stack Navigator with proper screen transitions
- Navigation guards (prevent back to login after auth)
- Clean UI with consistent styling

✅ **Form Handling**
- React Hook Form integration
- Input validation
- Loading states with ActivityIndicator
- Error handling and user feedback

✅ **API Integration**
- Axios HTTP client
- Token-based authentication
- Error handling
- Async/await patterns

## Troubleshooting

### Common Issues:

1. **Metro bundler issues**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Dependencies not found**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **API connection issues**
   - Ensure your backend is running on port 8001
   - Check that your IP address is correct in `services/api.js`
   - Make sure your device/simulator can reach your development machine

4. **Navigation issues**
   - Ensure all screen imports are correct in `AppNavigator.js`
   - Check that screen names match between navigator and navigation calls

## Next Steps

After testing the basic flow, you can:
- Implement the "View Children" functionality
- Add more child management features
- Integrate real-time tracking
- Add push notifications
- Implement driver-side features

## Backend Requirements

Make sure your backend API supports these endpoints:
- `POST /auth/login` - Login with username/password
- `POST /auth/register` - Register new user
- `POST /children` - Add new child (for AddChildScreen)

The app expects the login response to include:
```json
{
  "access_token": "jwt_token_here",
  "user": { ... }
}
```