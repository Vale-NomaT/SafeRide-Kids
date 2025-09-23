# Node.js Installation Required

## Issue
Node.js and npm are not currently installed on your system, which are required to run the React Native SafeRide Kids app.

## Installation Options

### Option 1: Download from Official Website (Recommended)
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (Long Term Support) for Windows
3. Run the installer (.msi file)
4. Follow the installation wizard (accept all defaults)
5. Restart your terminal/command prompt

### Option 2: Using Windows Package Manager (winget)
If you have winget available, run:
```powershell
winget install OpenJS.NodeJS
```

### Option 3: Using Chocolatey (if installed)
If you have Chocolatey package manager:
```powershell
choco install nodejs
```

## Verification
After installation, verify Node.js and npm are working:
```bash
node --version
npm --version
```

You should see version numbers for both commands.

## Next Steps
Once Node.js is installed:
1. Restart your terminal
2. Navigate back to the project directory
3. Run `npm install` to install dependencies
4. Run `npm start` or `expo start` to start the development server

## Alternative: Use Expo CLI Directly
If you prefer to use Expo CLI globally:
```bash
npm install -g @expo/cli
expo start
```

## React Native Development Environment
For full React Native development, you might also want to install:
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Expo CLI for easier development

## Troubleshooting
If you encounter PATH issues after installation:
1. Restart your terminal completely
2. Check if Node.js was added to your system PATH
3. You might need to restart your computer in some cases