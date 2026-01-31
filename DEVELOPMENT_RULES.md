# Development Rules & Build Guidelines

This document defines mandatory rules for building and maintaining this Expo React Native application.

## Package Manager Requirements (MANDATORY)

### npm ONLY
- **Use npm exclusively** as the package manager
- Never introduce Bun, Yarn, or PNPM
- Never create or modify `bun.lockb`, `yarn.lock`, or `pnpm-lock.yaml`
- If such files exist, they must be removed immediately

### Dependency Sync Requirements
- Always keep `package.json` and `package-lock.json` fully in sync
- Any dependency change requires regenerating `package-lock.json` via `npm install`
- All dependency changes must be compatible with `npm ci`
- Assume cloud builds run `npm ci --include=dev`

### Package Resolution
- Do not rely on implicit dependency resolution
- All required packages must appear correctly in `package-lock.json`
- Prefer exact or compatible semver ranges that are stable with Expo
- Do not auto-upgrade transitive dependencies unless required

## Compatibility Requirements

### Node.js Version
- Target Node.js 18.x compatibility
- Do not use APIs or tooling that require newer Node versions
- Test compatibility with Node.js 18.x LTS

### Build Targets
This app must run on:
- Rork cloud builds
- Expo Go
- iOS devices/simulators
- Android devices/emulators

## Expo / Android Stability Rules

### Testing Environments
Assume Android testing may occur via:
- Expo Go
- Expo tunnel mode  
- Android emulator
- Physical Android devices

### Configuration Requirements
- Do not introduce configurations that depend on LAN-only networking
- Favor Expo-compatible defaults
- If `expo-dev-client` is present, ensure configuration is valid for dev builds
- All network configurations must support tunnel mode fallback

## General Coding Rules

1. **No Unauthorized Tooling**: Do not add build tools, scripts, or package managers without explicit instruction
2. **Cloud Build Compatibility**: All changes must be compatible with Rork cloud builds and Expo EAS workflows
3. **Dependency Stability**: Avoid package version drift; prefer stable versions
4. **Lock File Integrity**: The `package-lock.json` file is the source of truth for dependency resolution

## Violation Handling

If any requested change would violate these rules, propose a compliant alternative instead. Do not proceed with rule-violating implementations.

## Emergency Recovery

If the repository becomes contaminated with non-npm lock files:

1. Delete `bun.lockb`, `bun.lock`, `yarn.lock`, `pnpm-lock.yaml` if present
2. Delete `node_modules` directory
3. Run `npm install` to regenerate clean `package-lock.json`
4. Commit the cleaned state

## Build Verification Checklist

Before committing dependency changes:

- [ ] Only `package-lock.json` exists (no other lock files)
- [ ] `npm ci` completes successfully
- [ ] Changes work in Expo Go
- [ ] Changes work in Android builds
- [ ] No Node.js 18.x compatibility issues
- [ ] `.gitignore` and `.easignore` block unwanted lock files
