# Update App Icons with Custom Image

## Current Status
✅ APK built successfully: `equyvo-app.apk`
✅ Previous icons deleted
✅ Placeholder icons created (transparent)

## To Update with Your Custom Icon

### Method 1: Using the Icon Generator Script
1. Save your uploaded image as `app-icon.png` in the project root
2. Run: `node generate-icons.js`
3. Rebuild APK: `cd android && ./gradlew assembleDebug`

### Method 2: Manual Update
1. Save your image as `app-icon.png` (1024x1024 recommended)
2. The script will generate all required sizes automatically:
   - Regular launcher icons (48-192dp)
   - Adaptive icon foregrounds (108-432dp)
   - Web icons (180px, 192px, 512px)

### Icon Locations
- Android: `android/app/src/main/res/mipmap-*/`
- Web: `public/icons/`
- APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

## After Updating Icons
```bash
# Sync with Capacitor
npx cap sync

# Rebuild APK
cd android && ./gradlew assembleDebug

# Copy new APK
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "equyvo-app.apk"
```

## Generated APK
Current APK location: `equyvo-app.apk` (with placeholder icons)
