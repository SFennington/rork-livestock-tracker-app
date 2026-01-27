# Build and Submit Workflow

When user says **"build and submit"**, execute this complete workflow:

## 1. Version Bump (Minor Revision Strategy)
Update version numbers in THREE locations:

### app.json
- Increment `version` (e.g., "1.4.0" → "1.4.1")
- Increment `android.versionCode` by 1 (e.g., 18 → 19)

### android/app/build.gradle
- Update `versionName` to match app.json version
- Update `versionCode` to match app.json versionCode

### app/(tabs)/settings/index.tsx
- Update the version text display at bottom of settings page (search for "Version 1.4.0")
- Match the version from app.json

## 2. Commit Version Changes
```powershell
git add -A
git commit -m "Bump version to X.X.X (build XX)"
git push
```

## 3. Build Release
```powershell
.\build-and-submit.ps1
```

## 4. Manual Steps (if script doesn't auto-submit)
- If build succeeds but doesn't auto-submit to Google Play:
  - Download the .aab from EAS Build
  - Upload to Google Play Console manually to Alpha track
  - Or use: `eas submit --platform android --latest`

## Version Strategy Notes
- Use **minor revisions** (1.4.1, 1.4.2, etc.) for incremental updates
- Build number (versionCode) increments by 1 each build
- Version and build number must be higher than previous release

---

## Package Manager Troubleshooting

### ⚠️ CRITICAL: This repo uses npm ONLY
- **Never** use bun, yarn, or pnpm
- EAS Build auto-detects package manager by lockfile presence
- If `bun.lock` exists, EAS ignores all config and uses bun (breaks builds)

### If builds fail with "lockfile had changes, but lockfile is frozen":
1. Check for `bun.lock` or other non-npm lockfiles:
   ```powershell
   Get-ChildItem -Filter "*.lock*"
   ```
2. Delete any bun/yarn/pnpm lockfiles:
   ```powershell
   Remove-Item -Force bun.lock, bun.lockb, yarn.lock, pnpm-lock.yaml -ErrorAction SilentlyContinue
   ```
3. Regenerate `package-lock.json`:
   ```powershell
   npm install --legacy-peer-deps
   ```
4. Commit and push:
   ```powershell
   git add .; git commit -m "Fix lockfile - use npm only"; git push
   ```

### Protected files (blocked in .gitignore and .easignore):
- `bun.lock` / `bun.lockb`
- `yarn.lock`
- `pnpm-lock.yaml`

### Required config:
- **package.json**: `"packageManager": "npm@10.9.0"`
- **eas.json**: `"EAS_BUILD_PACKAGE_MANAGER": "npm"` in both production & preview profiles
- **.npmrc**: `legacy-peer-deps=true`
