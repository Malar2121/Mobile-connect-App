function Stop-MetroPort([int]$Port = 8081) {
  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -and $conn.OwningProcess -ne 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

Stop-MetroPort 8081
Stop-MetroPort 8082
