# Production Deployment Checklist

Use this checklist when preparing to package and distribute your Electron application.

## 📋 Pre-Packaging Checklist

### ✅ Required Before First Package

- [ ] **App Icon Added**
  - File: `build/icon.ico`
  - Size: 256x256 or 512x512 pixels
  - Format: ICO (Windows Icon)
  - See: `build/README.md` for creation instructions

- [ ] **package.json Updated**
  - [ ] `name` - Your app name (lowercase, hyphenated)
  - [ ] `version` - Correct version number
  - [ ] `description` - Clear app description
  - [ ] `author` - Your name/company and email
  - [ ] `keywords` - Relevant search keywords

- [ ] **electron-builder.json Updated**
  - [ ] `appId` - Unique identifier (e.g., com.company.appname)
  - [ ] `productName` - Display name for your app
  - [ ] `publisherName` - Your company name

- [ ] **Test Build Works**
  - [ ] Run `pnpm build` - No TypeScript errors
  - [ ] Run `pnpm package:dir` - Unpacked build successful
  - [ ] Test the unpacked app in `release/win-unpacked/`
  - [ ] Verify app icon appears correctly
  - [ ] Test all major features work

### ✅ Database Configuration (If Using)

- [ ] **Custom Tables Created**
  - [ ] Modified `src/main/database.ts` with your schema
  - [ ] Updated `src/main/db-operations.ts` with CRUD operations
  - [ ] Updated IPC handlers in `src/main/ipc-handlers.ts`
  - [ ] Exposed new methods in `src/preload/preload.ts`

- [ ] **Database Tested**
  - [ ] Create operations work
  - [ ] Read operations work
  - [ ] Update operations work
  - [ ] Delete operations work
  - [ ] Transactions work correctly

### ✅ UI/UX Polish

- [ ] **Remove Demo Components**
  - [ ] Deleted or customized `DatabaseDemo.tsx`
  - [ ] Deleted `DatabaseTest.tsx`
  - [ ] Updated `App.tsx` with your UI

- [ ] **Branding Complete**
  - [ ] Custom colors in `src/renderer/src/index.css`
  - [ ] App title updated in `src/renderer/index.html`
  - [ ] Window title set in `src/main/main.ts`

- [ ] **Testing**
  - [ ] All UI components render correctly
  - [ ] Hot reload works during development
  - [ ] No console errors in DevTools
  - [ ] Responsive design (if applicable)

## 🔒 Security Checklist

### ✅ Security Hardening

- [ ] **Code Review**
  - [ ] No hardcoded passwords or API keys
  - [ ] No sensitive data in client-side code
  - [ ] Environment variables used for secrets

- [ ] **CSP Headers**
  - [ ] Verify CSP meta tag in `src/renderer/index.html`
  - [ ] Test app works with CSP enabled
  - [ ] No CSP violations in console

- [ ] **IPC Security**
  - [ ] Only whitelisted IPC channels exposed
  - [ ] Database access only through IPC (not direct)
  - [ ] Input validation on all IPC handlers

- [ ] **Dependencies**
  - [ ] Run `pnpm audit` - Check for vulnerabilities
  - [ ] Update dependencies if needed
  - [ ] Test app after updates

## 📦 Code Signing (Recommended for Distribution)

### ✅ Code Signing Setup

- [ ] **Certificate Obtained**
  - [ ] Purchased from trusted CA (DigiCert, Sectigo, etc.)
  - [ ] Certificate file received (.pfx)
  - [ ] Password securely stored

- [ ] **Certificate Installed**
  - [ ] Saved to `certs/certificate.pfx`
  - [ ] Added `certs/` to `.gitignore` ✅ (already done)
  - [ ] Environment variable set: `$env:CERTIFICATE_PASSWORD`

- [ ] **electron-builder.json Configured**
  - [ ] `certificateFile` path correct
  - [ ] `certificatePassword` uses env variable
  - [ ] `signingHashAlgorithms` includes "sha256"
  - [ ] `publisherName` set to your company

- [ ] **Signing Tested**
  - [ ] Built signed package: `pnpm package`
  - [ ] Verified signature: `Get-AuthenticodeSignature "release\*.exe"`
  - [ ] Status shows "Valid"
  - [ ] Publisher name correct

**Note:** If not code signing yet, that's okay for testing. See `.cursor/rules/CODE-SIGNING-GUIDE.md` when ready.

## 🚀 Auto-Updates Setup (Optional)

### ✅ Auto-Update Configuration

- [ ] **GitHub Releases Configured**
  - [ ] Repository has releases enabled
  - [ ] `publish` section in `electron-builder.json` correct
  - [ ] GitHub token available for releases

- [ ] **Update Logic Tested**
  - [ ] Auto-updater checks for updates
  - [ ] Update notifications work
  - [ ] Download and install work
  - [ ] Version comparison correct

- [ ] **Update UI Added** (Optional)
  - [ ] Created update notification component
  - [ ] "Install Update" button works
  - [ ] User can postpone updates

## 🧪 Testing Checklist

### ✅ Functional Testing

- [ ] **Development Mode**
  - [ ] `pnpm dev` starts without errors
  - [ ] Hot reload works
  - [ ] DevTools accessible

- [ ] **Production Build**
  - [ ] `pnpm build` compiles successfully
  - [ ] No TypeScript errors
  - [ ] No console warnings

- [ ] **Packaged App Testing**
  - [ ] Installer installs successfully
  - [ ] Desktop shortcut created
  - [ ] Start menu shortcut created
  - [ ] App launches from shortcuts
  - [ ] App icon displays correctly
  - [ ] All features work in packaged version

- [ ] **Database Testing (If Using)**
  - [ ] Database file created in AppData
  - [ ] CRUD operations work
  - [ ] App restarts preserve data
  - [ ] Uninstall doesn't delete user data (optional)

- [ ] **Performance**
  - [ ] App starts in reasonable time (<5 seconds)
  - [ ] UI is responsive
  - [ ] No memory leaks during extended use
  - [ ] CPU usage acceptable

### ✅ Windows Compatibility

- [ ] **Windows Versions Tested**
  - [ ] Windows 11 (primary target)
  - [ ] Windows 10 (if supporting)

- [ ] **Installation Paths**
  - [ ] Default install location works
  - [ ] Custom install location works
  - [ ] Per-user installation (not requiring admin)

- [ ] **SmartScreen**
  - [ ] Signed app doesn't trigger warnings (if signed)
  - [ ] Unsigned app warns as expected (if not signed)

## 📝 Documentation Checklist

### ✅ User Documentation

- [ ] **README.md**
  - [ ] Installation instructions clear
  - [ ] Features documented
  - [ ] Screenshots included (optional)
  - [ ] Support/contact info

- [ ] **LICENSE**
  - [ ] License file present ✅ (already added)
  - [ ] Copyright year current
  - [ ] License type appropriate

- [ ] **CHANGELOG.md**
  - [ ] Version history documented
  - [ ] Latest changes listed
  - [ ] Breaking changes highlighted

### ✅ Developer Documentation

- [ ] **Code Comments**
  - [ ] Complex logic documented
  - [ ] IPC channels documented
  - [ ] Database schema documented

- [ ] **.cursor/rules/ Updated**
  - [ ] Project-specific rules current
  - [ ] Known issues documented

## 🌐 Distribution Checklist

### ✅ Release Preparation

- [ ] **Version Number**
  - [ ] Version incremented in `package.json`
  - [ ] Version follows semantic versioning
  - [ ] CHANGELOG.md updated

- [ ] **Build Variants**
  - [ ] NSIS installer created: `pnpm package`
  - [ ] Portable version created: `pnpm package:portable`
  - [ ] Both tested

- [ ] **Release Files**
  - [ ] Installer size reasonable
  - [ ] All files in `release/` directory
  - [ ] File names include version number

### ✅ Distribution Channels

- [ ] **GitHub Releases**
  - [ ] Release created with tag (e.g., v1.0.0)
  - [ ] Installer uploaded
  - [ ] Release notes written
  - [ ] Pre-release/draft status set correctly

- [ ] **Website/Download Page** (If applicable)
  - [ ] Download link updated
  - [ ] System requirements listed
  - [ ] Installation instructions

- [ ] **Auto-Updates** (If enabled)
  - [ ] `latest.yml` published with installer
  - [ ] Update URL accessible

## 🔍 Final Verification

### ✅ Pre-Release Checks

- [ ] **Fresh Install Test**
  - [ ] Uninstall any existing version
  - [ ] Install from installer file
  - [ ] App launches successfully
  - [ ] All features work
  - [ ] Uninstall works

- [ ] **Multiple Machines** (Recommended)
  - [ ] Test on at least 2 different PCs
  - [ ] Different Windows versions (if possible)
  - [ ] Clean systems (no dev tools)

- [ ] **User Acceptance**
  - [ ] Beta testers reviewed (if applicable)
  - [ ] Critical bugs resolved
  - [ ] User feedback incorporated

### ✅ Launch Day

- [ ] **Release Published**
  - [ ] GitHub release made public
  - [ ] Download links verified
  - [ ] Announcement posted (if applicable)

- [ ] **Monitoring**
  - [ ] Watch for bug reports
  - [ ] Check download statistics
  - [ ] Monitor crash reports (if enabled)

- [ ] **Support Ready**
  - [ ] Documentation accessible
  - [ ] Support channels ready
  - [ ] FAQs prepared

## 📊 Post-Release

### ✅ After Launch

- [ ] **User Feedback**
  - [ ] Collect user feedback
  - [ ] Prioritize issues
  - [ ] Plan next version

- [ ] **Updates**
  - [ ] Monitor certificate expiry (if signed)
  - [ ] Plan update schedule
  - [ ] Maintain changelog

---

## Quick Command Reference

```powershell
# Development
pnpm dev

# Build for testing
pnpm build
pnpm package:dir

# Create installers
pnpm package              # NSIS installer
pnpm package:portable     # Portable .exe
pnpm package:all          # Both formats

# Verify signature (if signed)
Get-AuthenticodeSignature "release\Your-App-Setup-1.0.0.exe"

# Clean build
pnpm clean
pnpm install
pnpm build
```

---

## 🆘 Common Issues Before Release

**"App icon not showing"**
- Verify `build/icon.ico` exists
- Rebuild: `pnpm clean && pnpm package`

**"SmartScreen warning"**
- Expected without code signing
- See CODE-SIGNING-GUIDE.md to eliminate

**"Database not working in packaged app"**
- Verify `asarUnpack` in electron-builder.json includes better-sqlite3
- Rebuild native modules: `pnpm rebuild`

**"App crashes on launch"**
- Check for missing dependencies
- Verify CSP doesn't block resources
- Test with DevTools: temporarily enable in production

---

**Last Updated:** November 24, 2025
**Boilerplate Version:** 1.0.0

