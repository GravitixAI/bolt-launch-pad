import { promises as fs } from 'fs';

/**
 * Parse a Windows .url file to extract the URL
 * .url files are INI-style files with format:
 * [InternetShortcut]
 * URL=https://example.com
 */
export async function parseUrlFile(filePath: string): Promise<string | null> {
  try {
    console.log('📄 Parsing .url file:', filePath);
    
    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Look for the URL= line in the [InternetShortcut] section
    const lines = content.split(/\r?\n/);
    let inInternetShortcutSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if we're entering the [InternetShortcut] section
      if (trimmedLine === '[InternetShortcut]') {
        inInternetShortcutSection = true;
        continue;
      }
      
      // Check if we're entering a different section
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        inInternetShortcutSection = false;
        continue;
      }
      
      // Look for URL= line within the [InternetShortcut] section
      if (inInternetShortcutSection && trimmedLine.startsWith('URL=')) {
        const url = trimmedLine.substring(4).trim();
        
        // Validate that it's a proper URL
        try {
          new URL(url);
          console.log('✅ Extracted URL:', url);
          return url;
        } catch {
          console.error('❌ Invalid URL format:', url);
          return null;
        }
      }
    }
    
    console.warn('⚠️ No URL found in .url file');
    return null;
  } catch (error) {
    console.error('❌ Error parsing .url file:', error);
    return null;
  }
}

