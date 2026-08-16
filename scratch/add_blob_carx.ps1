$token = "vercel_blob_rw_tq40e6Llpoy8l39a_AVeDEQFHe2IXIemPVfXghl5qCkhaev"

# Add to hmcar-system project (already done - just verify)
Write-Host "=== Checking hmcar-system BLOB token ==="
$check = vercel env ls --token (vercel whoami 2>$null) 2>&1
Write-Host "Done checking."

# Now add to carx-system project 
Write-Host "=== Adding BLOB token to carx-system ==="
Set-Location "C:\car-auction\carx-system"
vercel link --yes 2>&1 | Select-Object -Last 3
$token | vercel env add BLOB_READ_WRITE_TOKEN production

Write-Host "=== All done ==="
Set-Location "C:\car-auction"
