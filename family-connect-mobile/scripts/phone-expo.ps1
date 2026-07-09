$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'stop-metro.ps1')

$wifi = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.InterfaceAlias -match 'Wi-?Fi' -and $_.IPAddress -notmatch '^169\.' } |
  Select-Object -First 1

$ip = if ($wifi) { $wifi.IPAddress } else { 'localhost' }

$env:EXPO_PUBLIC_API_URL = "http://${ip}:5000"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip

Write-Host "Phone mode - API: $env:EXPO_PUBLIC_API_URL"

Set-Location (Split-Path $PSScriptRoot -Parent)
npx expo start --offline --port 8081
