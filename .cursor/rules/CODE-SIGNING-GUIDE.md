# Code Signing Guide for Windows Applications

## Why Code Signing Matters

Without code signing, Windows users will see **SmartScreen warnings** when they try to install or run your application:

> ⚠️ "Windows protected your PC"
> "Microsoft Defender SmartScreen prevented an unrecognized app from starting"

This significantly hurts user trust and adoption. Code signing:
- ✅ Removes SmartScreen warnings
- ✅ Shows your company/publisher name
- ✅ Proves the app hasn't been tampered with
- ✅ Required for automatic updates to work properly

---

## Getting a Code Signing Certificate

### Option 1: Standard Code Signing Certificate (Recommended for most)

**Providers:**
- [DigiCert](https://www.digicert.com/signing/code-signing-certificates) - $474/year
- [Sectigo (formerly Comodo)](https://sectigo.com/ssl-certificates-tls/code-signing) - $179/year
- [SSL.com](https://www.ssl.com/certificates/code-signing/) - $249/year

**Requirements:**
- Business registration documents
- Email verification
- Phone verification
- Identity verification (documents)

**Timeline:** 1-5 business days

**What you get:** A `.pfx` or `.p12` file with a password

### Option 2: EV (Extended Validation) Code Signing (Best, but expensive)

**Benefits:**
- ✅ **Instant SmartScreen reputation** (no warnings from day 1)
- ✅ Higher user trust
- ✅ More rigorous vetting process

**Cost:** $300-$600/year

**Requirements:**
- Everything from standard cert
- More extensive business verification
- Physical USB token (hardware security module)

**Timeline:** 3-7 business days

**Note:** EV certs require a physical USB token device. You'll need to be present at the build machine.

### Option 3: Self-Signed Certificate (Testing/Development ONLY)

**Use case:** Internal testing, not for distribution

```powershell
# Create self-signed certificate (Windows)
$cert = New-SelfSignedCertificate -Type CodeSigningCert `
  -Subject "CN=YourCompany, O=YourCompany, C=US" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeySpec Signature

# Export to PFX
$password = ConvertTo-SecureString -String "your-password" -Force -AsPlainText
Export-PfxCertificate -Cert $cert `
  -FilePath "$env:USERPROFILE\Desktop\cert.pfx" `
  -Password $password
```

⚠️ **WARNING:** Self-signed certificates will still trigger SmartScreen warnings! Only use for testing.

---

## Setting Up Code Signing

### Step 1: Obtain Your Certificate

After purchasing, you'll receive:
- A `.pfx` or `.p12` file (certificate with private key)
- A password to unlock it

### Step 2: Store Certificate Securely

**For Development/Testing:**
```
your-project/
├── certs/
│   └── certificate.pfx  (DO NOT COMMIT TO GIT!)
```

**Add to `.gitignore`:**
```
# Code signing certificates
*.pfx
*.p12
certs/
```

**For CI/CD:**
- Store certificate as base64 encoded secret
- Store password in environment variable
- Never commit certificates to version control

### Step 3: Configure electron-builder

Update `electron-builder.json`:

```json
{
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico",
    "certificateFile": "certs/certificate.pfx",
    "certificatePassword": "env:CERTIFICATE_PASSWORD",
    "signingHashAlgorithms": ["sha256"],
    "publisherName": "Your Company Name",
    "verifyUpdateCodeSignature": true
  }
}
```

**Key fields:**
- `certificateFile`: Path to your `.pfx` file
- `certificatePassword`: Use `env:VARIABLE_NAME` to read from environment variable
- `signingHashAlgorithms`: Use SHA-256 (more secure than SHA-1)
- `publisherName`: Your company name (shows in Windows)
- `verifyUpdateCodeSignature`: Ensures updates are signed by the same cert

### Step 4: Set Environment Variable

**Windows (PowerShell):**
```powershell
# Temporary (current session only)
$env:CERTIFICATE_PASSWORD = "your-certificate-password"

# Permanent (system-wide)
[System.Environment]::SetEnvironmentVariable('CERTIFICATE_PASSWORD', 'your-password', 'User')
```

**Verify:**
```powershell
echo $env:CERTIFICATE_PASSWORD
```

### Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "package": "pnpm build && electron-builder build --win --config",
    "package:signed": "pnpm build && electron-builder build --win --config electron-builder.json"
  }
}
```

### Step 6: Build and Verify

```powershell
# Build the signed application
pnpm package

# Verify the signature (Windows)
Get-AuthenticodeSignature "release\Your App Setup.exe"
```

**Expected output:**
```
SignerCertificate      : [Subject]
                           CN=Your Company Name
                         [Issuer]
                           CN=DigiCert...
Status                 : Valid
```

---

## CI/CD Setup (GitHub Actions)

### Store Certificate as Secret

1. **Convert certificate to base64:**
```powershell
$bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File certificate.txt
```

2. **Add to GitHub Secrets:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secrets:
     - `CERTIFICATE_BASE64` - The base64 string
     - `CERTIFICATE_PASSWORD` - The certificate password

### GitHub Actions Workflow

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Decode certificate
        run: |
          $base64 = "${{ secrets.CERTIFICATE_BASE64 }}"
          $bytes = [System.Convert]::FromBase64String($base64)
          [System.IO.File]::WriteAllBytes("$env:GITHUB_WORKSPACE\certs\certificate.pfx", $bytes)
        
      - name: Build and package
        env:
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm package
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: release/*.exe
          
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: release/*.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Troubleshooting

### "Certificate not found"
```
Error: Cannot sign: certificate not found
```

**Solution:**
- Verify certificate file path in `electron-builder.json`
- Check that the file exists: `Test-Path certs/certificate.pfx`

### "Invalid password"
```
Error: Invalid password for certificate
```

**Solution:**
- Verify environment variable: `echo $env:CERTIFICATE_PASSWORD`
- Try hardcoding password temporarily to test (remove after!)

### "Certificate has expired"
```
Error: Certificate has expired
```

**Solution:**
- Renew your certificate with the provider
- Replace the `.pfx` file
- Most providers offer renewal 90 days before expiry

### "Timestamp server failed"
```
Warning: timestampServer is not configured
```

**Solution:** Add to `electron-builder.json`:
```json
{
  "win": {
    "timeStampServer": "http://timestamp.digicert.com"
  }
}
```

**Why timestamp?** Allows your signed apps to be valid even after your certificate expires.

### "SmartScreen still shows warning"
Even with a valid certificate, SmartScreen may show warnings initially because:
- Your certificate hasn't built up reputation yet
- Not enough users have downloaded your app

**Solution:** 
- Use EV certificate (instant reputation)
- Or wait - reputation builds as more users download without issues
- Typically takes 1-3 months and ~3000+ downloads

---

## Cost Summary

| Solution | Cost | SmartScreen | Best For |
|----------|------|-------------|----------|
| Self-Signed | Free | ⚠️ Warning | Testing only |
| Standard Cert | $180-$500/year | ⚠️ Warning initially | Most apps |
| EV Cert | $300-$600/year | ✅ No warning | Professional apps |

---

## Testing Without a Certificate

While developing, you can test packaging without signing:

**Temporarily remove from `electron-builder.json`:**
```json
{
  "win": {
    // Comment out or remove these:
    // "certificateFile": "certs/certificate.pfx",
    // "certificatePassword": "env:CERTIFICATE_PASSWORD",
  }
}
```

The installer will build, but users will see SmartScreen warnings.

---

## Best Practices

1. ✅ **Never commit certificates to version control**
   - Add `*.pfx` and `certs/` to `.gitignore`

2. ✅ **Use environment variables for passwords**
   - Never hardcode passwords in config files

3. ✅ **Enable timestamping**
   - Ensures signed apps remain valid after cert expires

4. ✅ **Test signature verification**
   - Always verify signature after building:
     ```powershell
     Get-AuthenticodeSignature "release\Your App Setup.exe"
     ```

5. ✅ **Keep certificates backed up**
   - Store encrypted backups in a secure location
   - If lost, you'll need to get a new certificate ($$$)

6. ✅ **Set calendar reminders**
   - Renew certificate 90 days before expiry
   - Update certificate in CI/CD secrets

7. ✅ **Document the process**
   - Keep notes on where certificate is stored
   - Document password location (password manager)

---

## Quick Start Checklist

When you're ready to set up code signing:

- [ ] Purchase code signing certificate (or EV cert)
- [ ] Receive and save `.pfx` file securely
- [ ] Add `certs/` to `.gitignore`
- [ ] Store certificate in `certs/certificate.pfx`
- [ ] Set `CERTIFICATE_PASSWORD` environment variable
- [ ] Update `electron-builder.json` with signing config
- [ ] Test build: `pnpm package`
- [ ] Verify signature: `Get-AuthenticodeSignature "release\*.exe"`
- [ ] (Optional) Set up GitHub Actions with secrets
- [ ] Set renewal reminder (90 days before expiry)

---

## Additional Resources

- [Microsoft: Code Signing Best Practices](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-best-practices)
- [electron-builder: Code Signing](https://www.electron.build/code-signing)
- [DigiCert: Code Signing](https://www.digicert.com/signing/code-signing-certificates)

---

**Last Updated:** November 24, 2025
**Version:** 1.0.0

