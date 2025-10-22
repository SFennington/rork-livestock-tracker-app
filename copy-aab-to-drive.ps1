# PowerShell script to copy AAB file to Google Drive folder
# Usage: .\copy-aab-to-drive.ps1

Write-Host "Copying AAB file to Google Drive..." -ForegroundColor Green

# Define source and destination paths
$sourcePath = "android\app\build\outputs\bundle\release\app-release.aab"
$destinationPath = "G:\My Drive\Business\Apps\livestock Tracker\app-release-v1.0.5.aab"

# Check if source file exists
if (Test-Path $sourcePath) {
    Write-Host "Source file found: $sourcePath" -ForegroundColor Yellow
    
    # Check if destination directory exists
    $destinationDir = Split-Path $destinationPath -Parent
    if (Test-Path $destinationDir) {
        Write-Host "Destination directory found: $destinationDir" -ForegroundColor Yellow
        
        # Copy the file
        try {
            Copy-Item $sourcePath $destinationPath -Force
            Write-Host "✅ Successfully copied AAB file to Google Drive!" -ForegroundColor Green
            Write-Host "Destination: $destinationPath" -ForegroundColor Cyan
            
            # Get file size for confirmation
            $fileSize = (Get-Item $destinationPath).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            Write-Host "File size: $fileSizeMB MB" -ForegroundColor Cyan
            
        } catch {
            Write-Host "❌ Error copying file: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Destination directory not found: $destinationDir" -ForegroundColor Red
        Write-Host "Please check if Google Drive is mounted and the path is correct." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Source file not found: $sourcePath" -ForegroundColor Red
    Write-Host "Please run the build first: cd android && ./gradlew bundleRelease" -ForegroundColor Yellow
}

Write-Host "`nScript completed." -ForegroundColor Green
