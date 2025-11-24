# Build Assets

This folder contains assets used during the application build and packaging process.

## Required Files

### `icon.ico` (REQUIRED)
- **Purpose:** Application icon for Windows
- **Format:** ICO file
- **Recommended Size:** 256x256 or 512x512 pixels
- **Used For:** 
  - Application window icon
  - Taskbar icon
  - Desktop shortcut icon
  - Installer icon (if not customized)

**To create your icon:**
1. Design your app icon as a PNG (256x256 or larger, square)
2. Convert to ICO format using:
   - Online tools: https://convertio.co/png-ico/
   - Or: https://icoconvert.com/
   - Or Photoshop/GIMP
3. Save as `icon.ico` in this folder

### Optional Installer Customization

#### `installerIcon.ico`
- Custom icon for the installer itself
- If not provided, uses `icon.ico`

#### `uninstallerIcon.ico`
- Icon for the uninstaller
- If not provided, uses `icon.ico`

#### `installerHeader.bmp`
- **Size:** 150 x 57 pixels
- **Format:** BMP
- **Purpose:** Header image in installer wizard

#### `installerSidebar.bmp`
- **Size:** 164 x 314 pixels
- **Format:** BMP
- **Purpose:** Sidebar image in installer wizard

## Current Status

⚠️ **IMPORTANT:** You must add `icon.ico` before packaging the application!

The build process will fail or use the default Electron icon without it.

## Quick Start

For testing/development, you can use a temporary icon:
1. Find any PNG image (company logo, app logo, etc.)
2. Convert to ICO format
3. Place as `build/icon.ico`

For production:
1. Design a professional icon
2. Export at multiple resolutions (16x16, 32x32, 48x48, 64x64, 128x128, 256x256)
3. Bundle into a single ICO file
4. Replace `build/icon.ico`

