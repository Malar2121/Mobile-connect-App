$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'stop-metro.ps1')

$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$adb = Join-Path $sdk 'platform-tools\adb.exe'
$emulator = Join-Path $sdk 'emulator\emulator.exe'

if (-not (Test-Path $adb)) {
  Write-Error "adb not found. Android Studio → SDK Manager → install Platform-Tools."
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$(Join-Path $sdk 'platform-tools');$(Join-Path $sdk 'emulator');$env:Path"
$env:NODE_ENV = 'development'
$env:EXPO_PUBLIC_API_URL = 'http://10.0.2.2:5000'
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '10.0.2.2'

function Test-EmulatorReady {
  $list = & $adb devices 2>&1 | Out-String
  if ($list -notmatch 'emulator-\d+\s+device') { return $false }
  $booted = (& $adb shell getprop sys.boot_completed 2>$null | Out-String).Trim()
  return ($booted -eq '1')
}

function Restart-AdbIfNeeded {
  $list = & $adb devices 2>&1 | Out-String
  if ($list -match 'emulator-\d+\s+device') { return }
  $emuProc = Get-Process -Name 'qemu-system*', 'emulator' -ErrorAction SilentlyContinue
  if ($emuProc) {
    Write-Host ">>> Emulator process found but adb not connected. Restarting adb..."
    & $adb kill-server 2>$null | Out-Null
    Start-Sleep -Seconds 2
    & $adb start-server 2>$null | Out-Null
    Start-Sleep -Seconds 2
  }
}

if (-not (Test-EmulatorReady)) {
  Restart-AdbIfNeeded
}

if (-not (Test-EmulatorReady)) {
  $emuProc = Get-Process -Name 'qemu-system*', 'emulator' -ErrorAction SilentlyContinue
  if ($emuProc) {
    Write-Host ">>> Emulator window is open. Waiting for adb connection..."
    $deadline = (Get-Date).AddMinutes(8)
    $dots = 0
    while ((Get-Date) -lt $deadline) {
      Restart-AdbIfNeeded
      if (Test-EmulatorReady) {
        Write-Host ""
        Write-Host ">>> Emulator ready."
        break
      }
      $dots = ($dots + 1) % 4
      Write-Host ("`r>>> Waiting for emulator{0}   " -f ('.' * $dots)) -NoNewline
      Start-Sleep -Seconds 3
    }
    Write-Host ""
  }
}

if (-not (Test-EmulatorReady)) {
  $avds = & $emulator -list-avds 2>&1
  if (-not $avds) {
    Write-Error "No emulator found. Android Studio → Device Manager → Create Device."
  }

  $avd = ($avds | Select-Object -First 1).Trim()
  Write-Host ""
  Write-Host ">>> Starting emulator: $avd"
  Write-Host ">>> First boot can take 3-5 minutes. A phone window should appear."
  Write-Host ">>> If nothing appears, open Android Studio → Device Manager → Play"
  Write-Host ""

  Start-Process -FilePath $emulator -ArgumentList @(
    '-avd', $avd,
    '-no-metrics'
  )

  $deadline = (Get-Date).AddMinutes(8)
  $dots = 0
  while ((Get-Date) -lt $deadline) {
    if (Test-EmulatorReady) {
      Write-Host ""
      Write-Host ">>> Emulator ready."
      break
    }
    $dots = ($dots + 1) % 4
    Write-Host ("`r>>> Waiting for emulator{0}   " -f ('.' * $dots)) -NoNewline
    Start-Sleep -Seconds 3
  }

  Write-Host ""
  if (-not (Test-EmulatorReady)) {
    Write-Error @"
Emulator did not start in 8 minutes.

Try manually:
  1. Open Android Studio
  2. Device Manager (phone icon on right)
  3. Click Play on FamilyConnect_AVD
  4. Wait until Android home screen shows
  5. Run: npm run android
"@
  }
} else {
  Write-Host ">>> Emulator already running."
}

Write-Host ">>> Connecting emulator to Metro + backend..."
& $adb reverse tcp:8081 tcp:8081 | Out-Null
& $adb reverse tcp:5000 tcp:5000 | Out-Null

Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host ">>> Starting Expo Metro (clear cache)..."
npx expo start --offline --android --port 8081 --clear
