# ---------------------------------------------------------------------------
# Build local Android de release (Windows PowerShell):
#   .\scripts\build-android.ps1
# Rezultat în release\:
#   CalendarGunoi-v<ver>-<cod>-universal.apk  – toate telefoanele (mare)
#   CalendarGunoi-v<ver>-<cod>-arm64.apk      – telefoanele din ultimii ~8 ani (mic)
#   CalendarGunoi-v<ver>-<cod>.aab            – pentru Google Play
#   github\CalendarGunoi.apk + CalendarGunoi-universal.apk – de urcat în GitHub Releases
#                                                           (linkurile de pe pagină folosesc aceste nume)
# Cerințe: Node 18+, JDK 17 (JAVA_HOME), Android SDK (ANDROID_HOME).
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$Root = (Get-Location).Path
$CredDir = Join-Path $Root 'credentials'
$Props = Join-Path $CredDir 'keystore.properties'
$Version = (node -p "require('./app.json').expo.version")
$VersionCode = (node -p "require('./app.json').expo.android.versionCode")
$Name = "CalendarGunoi-v$Version-$VersionCode"

function Say($m) { Write-Host "`n> $m" -ForegroundColor Yellow }
function Die($m) { Write-Host "`nX $m" -ForegroundColor Red; exit 1 }

Say 'Verific uneltele'
if ($env:JAVA_HOME) { $env:Path = "$env:JAVA_HOME\bin;$env:Path" }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { Die 'JDK 17 (keytool) nu a fost găsit.' }
$Sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $Sdk)) { Die 'Android SDK nu a fost găsit.' }

Say 'Typecheck'
npx tsc --noEmit; if (-not $?) { Die 'typecheck eșuat' }

if (-not (Test-Path $Props) -and -not $env:GUNOI_UPLOAD_STORE_FILE) {
  Say 'Nu există cheie de semnare - generez credentials\release.keystore'
  New-Item -ItemType Directory -Force $CredDir | Out-Null
  $Pass = (node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")
  keytool -genkeypair -v -storetype PKCS12 -keystore "$CredDir\release.keystore" -alias gunoi-upload `
    -keyalg RSA -keysize 4096 -validity 10000 -storepass $Pass -keypass $Pass `
    -dname "CN=Calendar Gunoi, O=Calendar Gunoi, C=RO"
  @"
storeFile=release.keystore
storePassword=$Pass
keyAlias=gunoi-upload
keyPassword=$Pass
"@ | Out-File -Encoding ascii $Props
  Write-Host 'FĂ BACKUP la folderul credentials\ - fără această cheie nu mai poți actualiza aplicația.' -ForegroundColor Magenta
}

Say 'Generez proiectul android\ (expo prebuild)'
npx expo prebuild --platform android --clean --no-install; if (-not $?) { Die 'prebuild eșuat' }
"sdk.dir=$($Sdk.Replace('\', '/'))" | Out-File -Encoding ascii android\local.properties

$GradleArgs = @('--no-daemon', '--max-workers=2', '-Dorg.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=512m', '-Pkotlin.compiler.execution.strategy=in-process')
$Apk = 'android\app\build\outputs\apk\release\app-release.apk'
$Aab = 'android\app\build\outputs\bundle\release\app-release.aab'
New-Item -ItemType Directory -Force release\github | Out-Null

Say 'gradlew assembleRelease bundleRelease (universal + AAB)'
Push-Location android
.\gradlew.bat @GradleArgs assembleRelease bundleRelease
$ok = $?
Pop-Location
if (-not $ok) { Die 'build gradle eșuat' }
Copy-Item $Apk "release\$Name-universal.apk" -Force
Copy-Item $Aab "release\$Name.aab" -Force
Copy-Item $Apk 'release\github\CalendarGunoi-universal.apk' -Force

Say 'gradlew assembleRelease (doar arm64-v8a)'
Push-Location android
.\gradlew.bat @GradleArgs assembleRelease -PreactNativeArchitectures=arm64-v8a
$ok = $?
Pop-Location
if (-not $ok) { Die 'build gradle arm64 eșuat' }
Copy-Item $Apk "release\$Name-arm64.apk" -Force
Copy-Item $Apk 'release\github\CalendarGunoi.apk' -Force

Say 'Gata:'
Get-ChildItem release -Recurse -File | Where-Object { $_.Name -like "$Name*" -or $_.Directory.Name -eq 'github' } |
  ForEach-Object { Write-Host ("  {0,-45} {1,6:N1} MB" -f $_.FullName.Substring($Root.Length + 1), ($_.Length / 1MB)) -ForegroundColor Green }
