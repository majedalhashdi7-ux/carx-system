$jwt = "23bd83159b04bcb28875f9fc6fa626a7b07eb9cad03a7a0b0a194f1add769d5dfc45749db443ffe08c39ca38079fbc1bc1a53f4c4f281553b7787b4e1e77847a"
$session = "eff948f14e1c62b00b8dc3debd3be34affc8cbca5fb02c88cbb76f042bb113113452b0a0cdf2744cb6334c293913e53c7e3901d5a639d74aac7cc18ec3264113"
$nextauth = "2952351ad4ff5e7891f724a6ab9f6ea05c18620b0fae8486d0fab0c0bafd33a3"

# Remove existing then re-add with new values
Write-Host "=== Updating JWT_SECRET ==="
vercel env rm JWT_SECRET production --yes 2>&1
Start-Sleep -Milliseconds 500
$jwt | vercel env add JWT_SECRET production

Write-Host "=== Updating SESSION_SECRET ==="
vercel env rm SESSION_SECRET production --yes 2>&1
Start-Sleep -Milliseconds 500
$session | vercel env add SESSION_SECRET production

Write-Host "=== Updating NEXTAUTH_SECRET ==="
vercel env rm NEXTAUTH_SECRET production --yes 2>&1
Start-Sleep -Milliseconds 500
$nextauth | vercel env add NEXTAUTH_SECRET production

Write-Host "=== All secrets updated successfully! ==="
