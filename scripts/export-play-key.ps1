# ---------------------------------------------------------------------------
# Exportă cheia de semnare existentă pentru Google Play App Signing („Use my own key”),
# ca aplicațiile instalate de pe GitHub să poată fi actualizate din Play Store.
#
# 1. Play Console → aplicația → Test and release → App integrity → App signing →
#    „Use a different key” / „Export and upload a key from Java keystore”.
# 2. Descarcă de acolo „pepk.jar” și „encryption_public_key.pem” în folderul store\
# 3. Rulează:  .\scripts\export-play-key.ps1
# 4. Încarcă în Play Console fișierul generat: store\play-signing-key.zip
#
# Fișierul .zip conține cheia (criptată pentru Google) – NU îl trimite nimănui și nu-l pune în git.
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$Pepk = 'store\pepk.jar'
$Pem = 'store\encryption_public_key.pem'
$Out = 'store\play-signing-key.zip'
foreach ($f in @($Pepk, $Pem, 'credentials\keystore.properties')) {
  if (-not (Test-Path $f)) { Write-Host "Lipsește $f (vezi pașii din antetul scriptului)." -ForegroundColor Red; exit 1 }
}

$props = @{}
Get-Content 'credentials\keystore.properties' | ForEach-Object {
  if ($_ -match '^\s*([^=#]+)=(.*)$') { $props[$Matches[1].Trim()] = $Matches[2].Trim() }
}
if ($env:JAVA_HOME) { $env:Path = "$env:JAVA_HOME\bin;$env:Path" }

java -jar $Pepk `
  "--keystore=credentials\$($props.storeFile)" `
  "--alias=$($props.keyAlias)" `
  "--keystore-pass=$($props.storePassword)" `
  "--key-pass=$($props.keyPassword)" `
  "--output=$Out" `
  --include-cert `
  --rsa-aes-encryption `
  "--encryption-key-path=$Pem"
if (-not $?) { Write-Host 'Exportul a eșuat.' -ForegroundColor Red; exit 1 }
Write-Host "OK: încarcă $Out în Play Console (App signing)." -ForegroundColor Green
