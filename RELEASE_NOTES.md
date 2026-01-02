# Release Process

## For each new release:

1. **Bump version code** in `app.json`:
   ```json
   "android": {
     "versionCode": X  // Increment by 1
   }
   ```

2. **Optional: Update app version** (user-facing):
   ```json
   "version": "1.0.X"  // Semantic versioning
   ```

3. **Commit and push**:
   ```bash
   git add app.json
   git commit -m "Bump version code to X for new Play Store release"
   git push
   ```

4. **Trigger build and submit**:
   ```bash
   gh workflow run build-and-submit.yml --ref main
   ```

5. **Monitor progress**:
   ```bash
   gh run list --workflow=build-and-submit.yml --limit 1 --json status,conclusion
   gh run watch  # Watch in real-time
   ```

## Version History

- **v10** (Dec 17, 2025): Fixed build workflow authentication issues
- **v9** (Dec 4, 2025): Previous release
- **v8** (Earlier): Initial releases

## Notes

- Version code must be unique and incremental for Google Play Store
- Build typically takes 10-15 minutes on EAS free tier
- Submission to alpha track is automated via workflow
- AAB file available at: https://expo.dev/accounts/sfennington/projects/livestock-tracker-app/builds
