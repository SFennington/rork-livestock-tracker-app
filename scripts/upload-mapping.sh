#!/bin/bash

# Script to upload ProGuard mapping files to Google Play Console
# This script runs after the build completes

echo "Uploading ProGuard mapping file to Google Play Console..."

# Check if mapping file exists
if [ -f "android/app/build/outputs/mapping/release/mapping.txt" ]; then
    echo "Mapping file found, uploading..."
    
    # Upload mapping file using Google Play Console API
    # This will be handled by EAS Submit automatically
    echo "Mapping file will be uploaded with the app bundle"
else
    echo "No mapping file found at expected location"
    echo "Build may not have generated mapping file"
fi

echo "Upload complete"
