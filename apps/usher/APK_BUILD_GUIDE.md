# Building APK for Usher App

Since this is a Next.js PWA, you have several options to create an APK for Android:

## Option 1: Capacitor (Recommended - Native App Experience)

Capacitor wraps your PWA in a native Android container, giving you full access to device features.

### Step 1: Install Capacitor

```bash
cd usher
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
```

When prompted:
- **App name**: BTPass Usher
- **App ID**: com.btcreative.btpass.usher
- **Web dir**: out (or .next/out after build)

### Step 2: Build Next.js App

```bash
npm run build
npm run export  # If using static export
# OR for standalone:
# The build output will be in .next/standalone
```

### Step 3: Add Android Platform

```bash
npx cap add android
npx cap sync
```

### Step 4: Open in Android Studio

```bash
npx cap open android
```

### Step 5: Build APK in Android Studio

1. Open the project in Android Studio
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 6: Install on Phone

- Transfer APK to your phone
- Enable "Install from Unknown Sources" in Android settings
- Open APK file and install

## Option 2: PWA Builder (Easiest - Quick APK)

PWA Builder can generate an APK directly from your deployed PWA.

### Step 1: Deploy Your App

Deploy the usher app to Vercel or any hosting service (must be HTTPS).

### Step 2: Use PWA Builder

1. Go to [pwabuilder.com](https://www.pwabuilder.com)
2. Enter your deployed URL (e.g., `https://btpass-usher.vercel.app`)
3. Click "Start"
4. Click "Android" → "Generate"
5. Download the APK

### Step 3: Install on Phone

- Transfer APK to your phone
- Enable "Install from Unknown Sources"
- Install the APK

## Option 3: Trusted Web Activity (TWA) - Google Play Store Ready

This creates a minimal Android app that wraps your PWA.

### Step 1: Install TWA Tools

```bash
npm install -g @bubblewrap/cli
```

### Step 2: Initialize TWA

```bash
bubblewrap init --manifest=https://your-deployed-app.com/manifest.json
```

### Step 3: Build APK

```bash
bubblewrap build
```

### Step 4: Find APK

APK will be in: `./app-release-signed.apk`

## Option 4: Manual Android Studio Project

Create a minimal Android app that loads your PWA URL.

### Step 1: Create Android Project

1. Open Android Studio
2. Create new project → Empty Activity
3. Package name: `com.btcreative.btpass.usher`

### Step 2: Add WebView

Edit `app/src/main/java/.../MainActivity.kt`:

```kotlin
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()
        
        // Replace with your deployed URL
        webView.loadUrl("https://your-usher-app.vercel.app")
        
        setContentView(webView)
    }
}
```

### Step 3: Add Internet Permission

Edit `app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Step 4: Build APK

**Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**

## Quick Start (Recommended: Capacitor)

```bash
# 1. Install Capacitor
cd usher
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize
npx cap init "BTPass Usher" "com.btcreative.btpass.usher"

# 3. Update capacitor.config.ts
# Set server.url to your deployed URL or use localhost for development

# 4. Add Android
npx cap add android

# 5. Build Next.js
npm run build

# 6. Sync
npx cap sync

# 7. Open in Android Studio
npx cap open android

# 8. Build APK in Android Studio
```

## Configuration Files

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.btcreative.btpass.usher',
  appName: 'BTPass Usher',
  webDir: 'out', // or '.next/out' depending on your build
  server: {
    // For production, use your deployed URL
    url: 'https://your-usher-app.vercel.app',
    // For development, use localhost
    // url: 'http://localhost:3000',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app needs camera access to scan QR codes'
      }
    }
  }
};

export default config;
```

## Important Notes

1. **Camera Permissions**: Make sure to request camera permissions for QR scanning
2. **HTTPS Required**: PWA features require HTTPS (except localhost)
3. **Deploy First**: For PWA Builder and TWA, deploy your app first
4. **Testing**: Test the PWA in browser first before building APK

## Troubleshooting

### Camera Not Working
- Add camera permissions in AndroidManifest.xml
- Request permissions at runtime in your app

### Offline Mode Not Working
- Ensure service worker is registered
- Check IndexedDB permissions

### Build Errors
- Make sure Next.js build completes successfully first
- Check that all dependencies are installed

## Alternative: Direct PWA Installation

Instead of APK, users can install the PWA directly:

1. Open your deployed app in Chrome on Android
2. Tap the menu (3 dots)
3. Select "Add to Home Screen"
4. App will install as a PWA

This is the simplest option and works immediately after deployment!
