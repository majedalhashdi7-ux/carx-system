$uri = "https://hmcar-system-two.vercel.app/api/v2/system/seed-data"
$headers = @{ "X-Tenant-ID" = "hmcar"; "Content-Type" = "application/json" }
$body = '{"secret":"hmcar-seed-2026"}'

Write-Host "Calling seed-data endpoint..."
try {
    $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 60
    Write-Host "Status: $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status: $statusCode"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
