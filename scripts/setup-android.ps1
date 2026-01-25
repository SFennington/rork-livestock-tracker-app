# Android Build Setup Script
# Run this after `expo prebuild` to configure Android SDK path

Write-Host "Setting up Android build configuration..." -ForegroundColor Green

# Find Android SDK
$sdkPath = $null
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
} elseif (Test-Path "C:\Android\Sdk") {
    $sdkPath = "C:\Android\Sdk"
} elseif ($env:ANDROID_HOME) {
    $sdkPath = $env:ANDROID_HOME
}

if (-not $sdkPath) {
    Write-Host "ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host "Install Android Studio or set ANDROID_HOME environment variable" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Cyan

# Create local.properties with SDK path
$localPropsPath = "android\local.properties"
if (Test-Path $localPropsPath) {
    Write-Host "local.properties already exists, updating..." -ForegroundColor Yellow
}

# Convert path to forward slashes and escape backslashes for properties file
$sdkPathEscaped = $sdkPath.Replace('\', '\\')
$content = "sdk.dir=$sdkPathEscaped"

Set-Content -Path $localPropsPath -Value $content -NoNewline
Write-Host "Created $localPropsPath" -ForegroundColor Green

Write-Host "`nAndroid build setup complete!" -ForegroundColor Green
Write-Host "You can now run: cd android; .\gradlew.bat assembleRelease; cd .." -ForegroundColor Cyan
