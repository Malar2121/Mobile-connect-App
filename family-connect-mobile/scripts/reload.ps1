$ErrorActionPreference = 'Stop'

$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
if (-not (Test-Path $adb)) {
  Write-Error "adb not found at $adb. Install Android SDK Platform-Tools."
}

$devices = & $adb devices 2>&1 | Out-String
if ($devices -notmatch 'emulator-\d+\s+device' -and $devices -notmatch '\w+\s+device') {
  Write-Error @"
No Android device/emulator connected.

1. Open Android Studio -> Device Manager -> Play on FamilyConnect_AVD
2. Wait for the home screen
3. Run: npm run reload
"@
}

Write-Host ">>> adb reverse (Metro + backend)..."
& $adb reverse tcp:8081 tcp:8081 | Out-Null
& $adb reverse tcp:5000 tcp:5000 | Out-Null

Write-Host ">>> Opening Expo on emulator..."
& $adb shell am start -a android.intent.action.VIEW -d 'exp://10.0.2.2:8081'
Write-Host ">>> Done."
