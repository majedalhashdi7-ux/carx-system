$base = "https://hmcar-system-two.vercel.app"
$hdrs = @{ "X-Tenant-ID" = "hmcar" }

function Test-Url($label, $url) {
    try {
        $r = Invoke-WebRequest -Uri $url -Headers $hdrs -UseBasicParsing -TimeoutSec 20
        $short = $r.Content.Substring(0, [Math]::Min(150, $r.Content.Length))
        Write-Host "✅ [$label] HTTP $($r.StatusCode) | $short"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd().Substring(0, [Math]::Min(150, $reader.ReadToEnd().Length))
        Write-Host "❌ [$label] HTTP $code | $body"
    }
}

Write-Host "`n=== اختبار HM CAR System API ==="
Test-Url "health v2"         "$base/api/v2/health"
Test-Url "public-health"     "$base/api/v2/system/public-health"
Test-Url "ping"              "$base/api/v2/ping-status"
Test-Url "cars"              "$base/api/v2/cars?limit=3"
Test-Url "brands"            "$base/api/v2/brands"
Test-Url "parts"             "$base/api/v2/parts?limit=3"
Test-Url "auctions"          "$base/api/v2/auctions"
Test-Url "frontend"          "$base/"
Write-Host "`n=== انتهى ==="
