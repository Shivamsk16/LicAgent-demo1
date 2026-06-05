# Smoke-test cron routes (PowerShell)
# Usage: $env:CRON_SECRET="your-secret"; .\scripts\test-crons.ps1

param([string]$BaseUrl = "http://localhost:3000")

if (-not $env:CRON_SECRET) {
  Write-Error "Set CRON_SECRET environment variable first"
  exit 1
}

$routes = @(
  "/api/cron/check-trials",
  "/api/cron/check-grace",
  "/api/cron/check-lapse",
  "/api/cron/check-maturity",
  "/api/cron/revival-deadlines",
  "/api/cron/send-reminders",
  "/api/cron/escalate-overdue"
)

$failed = 0
foreach ($path in $routes) {
  $url = "$($BaseUrl.TrimEnd('/'))$path"
  try {
    $res = Invoke-WebRequest -Uri $url -Headers @{ Authorization = "Bearer $env:CRON_SECRET" } -UseBasicParsing
    Write-Host "OK $($res.StatusCode) $path"
  } catch {
    $failed++
    Write-Host "FAIL $path" $_.Exception.Message
  }
}
exit $failed
