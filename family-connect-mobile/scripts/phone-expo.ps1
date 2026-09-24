$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'stop-metro.ps1')

# A phone reaches this computer by its address on the shared network. Prefer the
# Wi-Fi adapter, but fall back to any other real LAN address so a wired laptop
# still works when the phone is on the same router. Never fall back to
# 127.0.0.1: on a phone that address is the phone itself, so every request fails
# with a bare "Network error" that gives no hint why.
$candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and
    $_.InterfaceAlias -notmatch 'Loopback|VirtualBox|VMware|Hyper-V|vEthernet|WSL|Bluetooth'
  }

$wifi = $candidates | Where-Object { $_.InterfaceAlias -match 'Wi-?Fi' } | Select-Object -First 1
$chosen = if ($wifi) { $wifi } else { $candidates | Select-Object -First 1 }

if (-not $chosen) {
  Write-Host ''
  Write-Host 'No network address found for this computer.' -ForegroundColor Red
  Write-Host 'Connect this laptop to the same Wi-Fi network as the phone, then run this again.' -ForegroundColor Red
  Write-Host ''
  exit 1
}

$ip = $chosen.IPAddress
$env:NODE_ENV = 'development'
$env:EXPO_PUBLIC_API_URL = "http://${ip}:5000"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

if (-not $wifi) {
  Write-Host ''
  Write-Host "No Wi-Fi adapter found. Using '$($chosen.InterfaceAlias)' instead." -ForegroundColor Yellow
  Write-Host 'The phone must be on the same network as this address.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host "Phone mode - API: $env:EXPO_PUBLIC_API_URL"
Write-Host "Open this in the phone's browser first; it must answer before scanning the QR:" -ForegroundColor Cyan
Write-Host "  $env:EXPO_PUBLIC_API_URL/health" -ForegroundColor Cyan
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)
npx expo start -c --port 8081
