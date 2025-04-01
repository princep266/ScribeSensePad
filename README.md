# ScribeSensePad

A React Native application for text-to-speech and language translation.

## Prerequisites

Before running this project, make sure you have the following installed:

1. Node.js (v14 or later)
2. npm (v6 or later)
3. Java Development Kit (JDK) 11 or later
4. Android Studio
5. Android SDK
6. Android device or emulator

## Environment Setup

1. Set up ANDROID_HOME environment variable:
   - Open System Properties > Advanced > Environment Variables
   - Add new System Variable:
     - Variable name: ANDROID_HOME
     - Variable value: C:\Users\YourUsername\AppData\Local\Android\Sdk

2. Add platform-tools to PATH:
   - Add %ANDROID_HOME%\platform-tools to your PATH environment variable

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ScribeSensePad.git
cd ScribeSensePad
```

2. Run the dependency check script:
```bash
.\check_dependencies.ps1
```

3. Run the setup script:
```bash
.\setup.ps1
```

## Manual Installation (if scripts don't work)

1. Install project dependencies:
```bash
npm install
```

2. Install React Native CLI globally:
```bash
npm install -g react-native-cli
```

3. Install Android dependencies:
```bash
cd android
./gradlew clean
cd ..
```

4. Start Metro bundler:
```bash
npm start
```

5. In a new terminal, build and run the app:
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

1. If you encounter Gradle build issues:
   - Make sure you have the correct Java version installed
   - Try cleaning the project: `cd android && ./gradlew clean`
   - Check if all SDK tools are installed through Android Studio

2. If Metro bundler fails to start:
   - Kill any existing Metro processes
   - Clear Metro cache: `npm start -- --reset-cache`

3. If the app fails to install:
   - Make sure your device is connected and USB debugging is enabled
   - Try uninstalling the app first: `adb uninstall com.scribesensepad`

## Support

For any issues or questions, please open an issue in the repository.
