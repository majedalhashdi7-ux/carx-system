$uri = "https://hmcar-system-two.vercel.app/api/v2/system/cloud-seed?secret=hmcar-cloud-2026"
$headers = @{ "X-Tenant-ID" = "hmcar" }
Write-Host "Verifying HM CAR status..."
$res = Invoke-WebRequest -Uri "https://hmcar-system-two.vercel.app/api/v2/cars?limit=5" -Headers $headers -UseBasicParsing
Write-Host "Cars count response:" $res.Content.Substring(0, [Math]::Min(200, $res.Content.Length))
