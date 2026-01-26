# Build and Submit to Google Play Store
Write-Host "Starting production build..." -ForegroundColor Green

# Run build
eas build --platform android --profile production --non-interactive --wait

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nBuild completed! Submitting to Google Play Store..." -ForegroundColor Green

# Submit the latest build
eas submit --platform android --profile production --latest --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host "Submission failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll done! Your app has been submitted to the alpha track." -ForegroundColor Green
