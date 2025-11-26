import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { app } from 'electron';

const execAsync = promisify(exec);

// Load and cache default icons
let DEFAULT_POWERSHELL_ICON: string | null = null;
let DEFAULT_CMD_ICON: string | null = null;

/**
 * Load default icons from assets folder
 */
async function loadDefaultIcons() {
  if (DEFAULT_POWERSHELL_ICON && DEFAULT_CMD_ICON) {
    return; // Already loaded
  }

  try {
    // Get paths to icon files
    const isDev = !app.isPackaged;
    const basePath = isDev 
      ? path.join(process.cwd(), 'src', 'assets')
      : path.join(process.resourcesPath, 'assets');

    const psIconPath = path.join(basePath, 'powershell-icon.png');
    const cmdIconPath = path.join(basePath, 'cmd-icon.png');

    console.log('📂 Loading default icons from:', basePath);

    // Load and resize PowerShell icon
    if (fs.existsSync(psIconPath)) {
      const psBuffer = await sharp(psIconPath)
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      DEFAULT_POWERSHELL_ICON = `data:image/png;base64,${psBuffer.toString('base64')}`;
      console.log('✅ PowerShell icon loaded, length:', DEFAULT_POWERSHELL_ICON.length);
    } else {
      console.error('❌ PowerShell icon not found:', psIconPath);
    }

    // Load and resize CMD icon
    if (fs.existsSync(cmdIconPath)) {
      const cmdBuffer = await sharp(cmdIconPath)
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      DEFAULT_CMD_ICON = `data:image/png;base64,${cmdBuffer.toString('base64')}`;
      console.log('✅ CMD icon loaded, length:', DEFAULT_CMD_ICON.length);
    } else {
      console.error('❌ CMD icon not found:', cmdIconPath);
    }
  } catch (error) {
    console.error('❌ Error loading default icons:', error);
  }
}

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
export async function getDefaultPowerShellIcon(): Promise<string> {
  await loadDefaultIcons();
  return DEFAULT_POWERSHELL_ICON || '';
}

/**
 * Get default CMD icon
 */
export async function getDefaultCmdIcon(): Promise<string> {
  await loadDefaultIcons();
  return DEFAULT_CMD_ICON || '';
}

/**
 * Validate that a file picker selection is an executable
 */
export function isExecutable(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.exe', '.bat', '.cmd', '.ps1', '.lnk'].includes(ext);
}

