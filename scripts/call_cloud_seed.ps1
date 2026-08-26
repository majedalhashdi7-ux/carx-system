$uri = "https://hmcar-system-two.vercel.app/api/v2/system/cloud-seed?secret=hmcar-cloud-2026"
$headers = @{ "X-Tenant-ID" = "hmcar" }
Write-Host "Calling /api/v2/system/cloud-seed ..."
try {
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing -TimeoutSec 60
    Write-Host "SUCCESS - Status: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "FAILED - HTTP: $code"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
