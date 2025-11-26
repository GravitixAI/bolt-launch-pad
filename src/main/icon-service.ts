import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';

const execAsync = promisify(exec);

// Default icons (embedded as base64)
const DEFAULT_POWERSHELL_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABvUlEQVR4nO2WzUrDQBSFv1iFLlyI4kJ8AV/BrQtx4ytYV+5cuBBf4AU3gvgCbly5EF/AhQsXLkRBEBQE0YWgfnIhEJqmSSZtBD0wkJnMPefemZtMoEWLFv8JfcAI8AacA1+l0bwJrAL7wCswBXS1egCtwBywDXwCbyX9APYiArMR7gA4A2aB9lYP4B5YBt6Bk4ju+4FD4LUkgwWgu9UDsJ79A1hTTWzr3jJwDNzq3prG9wJ3wIGePVT+7rQDeALmNbixSf1Ybwqd01MADxp/08ztahDvAVyqJgtqxHJNAK+6/wR0pQDgTl1XO7CrG0vAfgMBvOjZF7CRCoBnfV3NwAbQoWeM1AhgU8++ge1UAKwDRzUC+NazLGVzADZqAnCq+ylN+dR9UhOAUz1rANiJBGAV+NB9DiylBOAMeNdFUztQqgP4UAD24gAYqRGAmd0BHE0FwDDwpK+zL2DXCkA7cA2cJAjgEhiPAmBBa7Kvxs87wBDwqHsz27cLdMQEULrmJyMC+AxaMQGcAysR7zC09gdjA7C8GQ4B4FWN3m9o7YEGAbyVxjsaWvunqRY/L60Q/yN+AJyZFOkLYYUfAAAAAElFTkSuQmCC';
const DEFAULT_CMD_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABpUlEQVR4nO2WzUrDQBDH/7VK8aDgQcGDvoAP4NWDePUVrCdvHjyIL/ACHgTxBTx48eSBB68ePHjwICgIgoKgr2CdgQkhaTfbNKl+MJBkJ/P7Z2c2uwG0aNGiBfAbJIEJ4Aq4BSq+UbsBq8ABcA4sAt2tHkASWAD2gXfg2Tc+xm8BDyKCy8A5MAu0t3oAT8BS5HxOAuN1ATgGXkV+CxjwA3ACPInMHDDU6gHYyP4FLNQ0sa57g8AJ8KIYO6r3AffAsei9+P5utQN4BhZU+Hiq/rDOFNqnRwEedf+u1dspBfAhvk67a/mLx3cUwIP6/psCeCBWOoDLynFiBHChe1/AeioAXlU2OYsJ0bOU7gD4FdlZAJU2gMMmATiQ/R9gJxUAa8BxkwBexP4NHKUCYBk4bBKAY9kvN+C/CxQaBPAs9lvNVsA88KznVbx2IKYCeNPa98cEcB0DgGdtsBoEcCf2yxEBXErBN+p5TgBQi/4HYKzaKgCugdUmAdR7hs+o9dduQLXt+x6V77tAAK9ifwfMpwJgGHj8YQAvYj+VEoBRYL9JAN+b/r/iD7+5EvigjDnDAAAAAElFTkSuQmCC';

/**
 * Extract icon from executable and convert to base64
 */
export async function extractIcon(executablePath: string): Promise<string | null> {
  try {
    if (!fs.existsSync(executablePath)) {
      console.error('Executable not found:', executablePath);
      return null;
    }

    const ext = path.extname(executablePath).toLowerCase();
    
    // For .exe files, extract icon using PowerShell
    if (ext === '.exe') {
      return await extractExeIcon(executablePath);
    }
    
    // For .lnk files, resolve the target and extract its icon
    if (ext === '.lnk') {
      const targetPath = await resolveShortcut(executablePath);
      if (targetPath) {
        return await extractExeIcon(targetPath);
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting icon:', error);
    return null;
  }
}

/**
 * Extract icon from .exe file using PowerShell
 */
async function extractExeIcon(exePath: string): Promise<string | null> {
  try {
    const tempIconPath = path.join(process.env.TEMP || '/tmp', `icon_${Date.now()}.png`);
    const tempScriptPath = path.join(process.env.TEMP || '/tmp', `extract_icon_${Date.now()}.ps1`);
    
    console.log('🎨 Extracting icon from:', exePath);
    console.log('📁 Temp icon path:', tempIconPath);
    
    // Create PowerShell script file to avoid command-line escaping issues
    const script = `
Add-Type -AssemblyName System.Drawing

try {
  Write-Host "Extracting icon from: ${exePath}"
  $icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${exePath}")
  
  if ($icon) {
    $bitmap = $icon.ToBitmap()
    $bitmap.Save("${tempIconPath}", [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $icon.Dispose()
    Write-Host "Icon saved to: ${tempIconPath}"
    exit 0
  } else {
    Write-Host "No icon found"
    exit 1
  }
} catch {
  Write-Host "Error: $($_.Exception.Message)"
  Write-Host $_.ScriptStackTrace
  exit 1
}
`;

    // Write script to temp file
    fs.writeFileSync(tempScriptPath, script, 'utf8');
    
    // Execute the script file
    const { stdout, stderr } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}"`);
    
    console.log('PowerShell stdout:', stdout);
    if (stderr) console.error('PowerShell stderr:', stderr);
    
    // Clean up script file
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    // Read the icon file and convert to base64
    if (fs.existsSync(tempIconPath)) {
      console.log('✅ Icon file exists, reading...');
      const iconBuffer = fs.readFileSync(tempIconPath);
      
      // Convert to PNG and resize to 32x32
      const pngBuffer = await sharp(iconBuffer)
        .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      // Clean up temp file
      fs.unlinkSync(tempIconPath);
      
      console.log('✅ Icon extracted successfully, length:', base64.length);
      return base64;
    } else {
      console.error('❌ Temp icon file was not created');
    }

    return null;
  } catch (error) {
    console.error('❌ Error extracting exe icon:', error);
    return null;
  }
}

/**
 * Resolve .lnk shortcut to actual target path
 */
async function resolveShortcut(lnkPath: string): Promise<string | null> {
  try {
    const script = `
      $WshShell = New-Object -ComObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
      $Shortcut.TargetPath
    `;

    const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`);
    const targetPath = stdout.trim();

    if (targetPath && fs.existsSync(targetPath)) {
      return targetPath;
    }

    return null;
  } catch (error) {
    console.error('Error resolving shortcut:', error);
    return null;
  }
}

/**
 * Get default PowerShell icon
 */
export function getDefaultPowerShellIcon(): string {
  return DEFAULT_POWERSHELL_ICON;
}

/**
 * Get default CMD icon
 */
export function getDefaultCmdIcon(): string {
  return DEFAULT_CMD_ICON;
}

/**
 * Validate that a file picker selection is an executable
 */
export function isExecutable(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.exe', '.bat', '.cmd', '.ps1', '.lnk'].includes(ext);
}

