# Build Audit — Phase 6: APK/AAB Build Preparation & Verification

**App:** Family Connect (Expo React Native, university FYP)
**Audited path:** `family-connect-mobile` (Expo SDK 54 / React Native 0.81.5)
**Host:** Windows 10 (PowerShell)
**Date:** 2026-07-03
**Scope:** Build/release configuration only (backend and mobile source logic owned by other workers).

---

## 1. Current Build Setup

| Item | Finding |
|------|---------|
| Workflow | **Managed / Prebuild Expo** (no committed native project; `/android` and `/ios` are gitignored) |
| Config source | `app.json` only — **no `app.config.js` / `app.config.ts`** |
| EAS | **Not configured** — no `eas.json`, EAS CLI not installed (`npx eas --version` → "could not determine executable") |
| Native `android/` folder | Did **not** exist before this audit. Generated during audit via `expo prebuild` (see §5). It is gitignored, so it is a reproducible build artifact, not a tracked change. |
| JS entry | `index.js` → `registerRootComponent(App)` (standard) |
| Expo | `expo ~54.0.35`, `react-native 0.81.5`, `react 19.1.0`, **New Architecture enabled** (`newArchEnabled=true`), Hermes enabled |
| Notable native deps | `react-native-reanimated 4`, `react-native-worklets`, `react-native-maps`, `expo-av`, `expo-location`, `expo-image-picker`, `expo-notifications`, `expo-secure-store` |

### Toolchain detected in this environment
| Tool | Status |
|------|--------|
| Node | v24.16.0 ✅ |
| JDK | Temurin **OpenJDK 21.0.11** ✅ |
| Android SDK | Present at `%LOCALAPPDATA%\Android\Sdk` ✅ (partial) |
| — platform-tools (adb) | ✅ present |
| — build-tools | `37.0.0` ✅ (Expo 54 targets 36.x; 37 generally accepted by AGP) |
| — platforms | **`android-34` only** ⚠️ (Expo 54 needs **`android-36`** — auto-downloaded at build if network allows) |
| — NDK | **Missing** ⚠️ (RN new-arch + reanimated/worklets compile C++; NDK ~27.x auto-downloaded at build) |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | **Not set** ⚠️ (must be exported for a local Gradle build) |
| EAS CLI | Not installed |
| Gradle wrapper | `gradle-8.14.3` (wrapper present in generated project; distribution not cached — ~150 MB download on first build) |

---

## 2. Verification Checklist

| Check | Status | Notes |
|-------|--------|-------|
| **Android permissions** | **PASS** | Generated manifest declares: `ACCESS_COARSE/FINE_LOCATION` (expo-location), `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` (expo-av voice), `READ/WRITE_EXTERNAL_STORAGE` (image picker/media), `VIBRATE` (notifications/haptics), `INTERNET`, `CAMERA` (added in this audit — see below), plus browsable `<queries>`. `SYSTEM_ALERT_WINDOW` is auto-added by RN (dev overlay) and remains in release — see WARNs. |
| **App icon** | **PASS** | `assets/icon.png` (22 KB) + notifications icon set. Recommend confirming icon is 1024×1024 for store listing. |
| **Adaptive icon** | **PASS** | `assets/adaptive-icon.png` (17 KB) + `#ffffff` background → generates `ic_launcher` / `ic_launcher_round`. |
| **Splash screen** | **WARN** | Configured (`splash-icon.png`, `resizeMode: contain`, `#ffffff`) and applied via `Theme.App.SplashScreen`. `splash-icon.png` is byte-identical to `adaptive-icon.png` (17547 B) → splash likely shows the launcher artwork. Cosmetic only; replace with a dedicated splash asset before release. |
| **Custom fonts** | **PASS** | Inter (400/500/600/700) via `@expo-google-fonts/inter`, loaded with `useFonts`, `expo-font` plugin registered. Bundled through the package (no missing files); graceful fallback to system fonts on load error. |
| **Bundled assets** | **PASS** | `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png` all present under `assets/`. No missing referenced asset. |
| **version (semver)** | **WARN** | `app.json` `version: "1.0.0"` (valid, used as `versionName`). But `package.json` `version: "1.0.0-rc.3"` — inconsistent. Align before release for clarity (build uses `app.json`). |
| **versionCode** | **PASS** (fixed) | Was **missing** (defaulted to 1). Explicitly set `android.versionCode: 1`. Increment on every store upload. |
| **package / applicationId** | **PASS** (fixed) | Was **absent** — a hard blocker for a valid build. Set to reverse-domain `com.familyconnect.mobile` (not a placeholder). Confirmed as `namespace` + `applicationId` in generated `app/build.gradle`. |
| **Signing configuration** | **WARN** | Managed project has **no production keystore and no EAS credentials**. Generated `release` build type falls back to `signingConfig signingConfigs.debug` → `assembleRelease`/`bundleRelease` produce an **installable but debug-signed** artifact, **NOT valid for Google Play**. A real upload/release keystore (or EAS-managed credentials) must be configured before store submission. |

### Additional WARNs (non-blocking)
- `SYSTEM_ALERT_WINDOW` and `WRITE_EXTERNAL_STORAGE` are broad; if the store review flags them, remove via `android.blockedPermissions` in `app.json` (only if unused).
- Prebuild warning: `userInterfaceStyle: Install expo-system-ui in your project to enable this feature.` — `userInterfaceStyle: "automatic"` is set but `expo-system-ui` isn't installed. Non-blocking; either install `expo-system-ui` or drop the setting.

---

## 3. Config Files Modified

Only one **tracked** file was changed. All changes are minimal and confined to Android release-blocking gaps.

**`family-connect-mobile/app.json`** — `expo.android` block:
```json
"android": {
  "package": "com.familyconnect.mobile",   // ADDED — was missing (hard build blocker); valid reverse-domain, not a placeholder
  "versionCode": 1,                          // ADDED — was missing; required, incrementable release build number
  "permissions": ["CAMERA"],                 // ADDED — camera capture (ImagePicker.launchCameraAsync) is used but CAMERA was not in the manifest
  "adaptiveIcon": { ... },
  "edgeToEdgeEnabled": true
}
```
Rationale:
- **`package`**: Without an `android.package`, a valid Android build cannot be produced. Chosen a real reverse-domain identifier.
- **`versionCode`**: Required integer build number for release; made explicit so it can be incremented per upload.
- **`permissions: ["CAMERA"]`**: `launchCameraAsync` is called in `ConversationScreen.js` and `UploadMemoryScreen.js`, but the merged manifest lacked `CAMERA`. Verified additive merge (re-ran prebuild — all auto-added permissions retained + CAMERA added).

> The `android/` folder present after this audit was generated by `expo prebuild` (gitignored artifact). It is **not** a tracked source change and can be safely deleted (`Remove-Item -Recurse -Force android`) to return to a pure managed project.

---

## 4. `npx expo-doctor` Results

`16/18 checks passed.` The 2 failures are **network/TLS errors reaching the Expo API**, not project defects:
- ✖ *Check Expo config schema* — `TypeError: fetch failed` / `Client network socket disconnected before secure TLS connection was established` (requires connection to Expo API).
- ✖ *Validate packages against React Native Directory* — `Directory check failed with unexpected server response`.

**Conclusion:** No local configuration defects reported by expo-doctor. The failures confirm the build environment has **restricted/unreliable outbound network**, which is the primary blocker for any build that must download dependencies (EAS cloud build, Gradle distribution, SDK platform-36, NDK, Maven artifacts).

---

## 5. Build Attempt & Status

### Prebuild (config verification) — SUCCESS ✅
```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
npx expo prebuild --platform android --no-install
```
Generated a complete native project: `AndroidManifest.xml`, `app/build.gradle` (`applicationId com.familyconnect.mobile`, `versionCode 1`, `versionName "1.0.0"`, release→debug signing fallback), and a full Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle-wrapper.jar`, Gradle 8.14.3).

### Local Gradle Release build (APK) — **NOT ATTEMPTED** ⛔
### Local Gradle Release build (AAB) — **NOT ATTEMPTED** ⛔

**Reason (deliberate, per audit guidance to avoid slow-failing builds):** required prerequisites are missing and outbound network is unreliable, so a Gradle build would fail slowly after large downloads:
1. **Android platform `android-36` not installed** (only `android-34`) — needs SDK download.
2. **NDK not installed** — RN New Architecture + `react-native-reanimated`/`react-native-worklets` compile native C++; AGP would auto-download NDK (~1 GB).
3. **Gradle 8.14.3 distribution not cached** — ~150 MB wrapper download on first run.
4. **Network is restricted** (confirmed by expo-doctor TLS failures) — the above downloads and Maven dependency resolution would not reliably complete.

### EAS (cloud) build — NOT ATTEMPTED (no interactive login; environment restricted)
Not configured (no `eas.json`, CLI absent) and requires authenticated cloud access. Commands to enable are in §6.

---

## 6. Exact Reproducible Commands to Produce a Release APK and AAB

All commands run from `d:\Family connect App\family-connect-mobile`.

### Path A — Local Gradle build (offline-capable machine with full Android toolchain)

**One-time prerequisites:**
```powershell
# 1. Install missing SDK components (Android Studio SDK Manager or sdkmanager):
#    - Android SDK Platform 36
#    - NDK (side by side) matching Expo 54 / RN 0.81 (~27.x)
#    - Android SDK Build-Tools 36.0.0
sdkmanager "platforms;android-36" "ndk;27.1.12297006" "build-tools;36.0.0"
sdkmanager --licenses   # accept all

# 2. Export environment (persist via System env vars for permanence)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
# JDK 17+ required — JDK 21 (Temurin) already present ✅
```

**Generate the native project (managed workflow):**
```powershell
npx expo prebuild --platform android
```

**Build Release APK** (installable artifact; distribute directly / sideload):
```powershell
cd android
.\gradlew.bat assembleRelease
# Output: android\app\build\outputs\apk\release\app-release.apk
```

**Build Release AAB** (for Google Play upload):
```powershell
cd android
.\gradlew.bat bundleRelease
# Output: android\app\build\outputs\bundle\release\app-release.aab
```

> **Signing for production:** the default `release` build type is wired to the **debug keystore** (fine for testing, rejected by Play). Before store submission, generate a real keystore and point `signingConfigs.release` at it (do NOT commit the keystore or passwords):
> ```powershell
> keytool -genkeypair -v -keystore family-connect-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
> ```
> Configure via `~/.gradle/gradle.properties` (secrets) + `android/app/build.gradle` `signingConfigs.release`, or preferably let EAS manage credentials (Path B).

### Path B — EAS cloud build (recommended for a managed project; needs Expo account + network)
```powershell
npm i -g eas-cli            # or: npx eas-cli@latest
eas login                   # interactive — Expo account required
eas build:configure         # creates eas.json (android build profiles)

# Release APK:
eas build --platform android --profile preview      # profile configured with android.buildType = "apk"
# Release AAB (store):
eas build --platform android --profile production    # default buildType = app-bundle
```
EAS generates and stores the Android keystore in the cloud (`eas credentials`), so no local keystore management is needed. Requires authenticated login and outbound network — **not possible in this restricted, non-interactive environment**.

---

## 7. Summary

- **APK build:** NOT ATTEMPTED — missing NDK + `android-36` platform + unreliable network (would fail slowly). Config is now build-ready; commands in §6.
- **AAB build:** NOT ATTEMPTED — same reasons.
- **Config blockers fixed:** missing `android.package` and `versionCode` (hard blockers), plus missing `CAMERA` permission for the camera feature.
- **Remaining pre-release actions (owner: release):** install SDK platform-36 + NDK, set `ANDROID_HOME`, configure a production keystore (or use EAS), align `package.json`↔`app.json` version, replace the placeholder splash asset.
