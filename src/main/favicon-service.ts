import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';

/**
 * Fetch favicon from URL and convert to base64
 */
export async function fetchFavicon(urlString: string): Promise<string | null> {
  try {
    const url = new URL(urlString);
    const baseUrl = `${url.protocol}//${url.hostname}`;

    // Strategy 1: Try /favicon.ico
    let faviconUrl = `${baseUrl}/favicon.ico`;
    let faviconBuffer = await downloadImage(faviconUrl);

    if (!faviconBuffer) {
      // Strategy 2: Try to parse HTML for favicon link
      faviconUrl = await findFaviconInHTML(urlString);
      if (faviconUrl) {
        faviconBuffer = await downloadImage(faviconUrl);
      }
    }

    if (!faviconBuffer) {
      // Strategy 3: Use Google's favicon service as fallback
      faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
      faviconBuffer = await downloadImage(faviconUrl);
    }

    if (!faviconBuffer) {
      console.log('No favicon found for:', urlString);
      return null;
    }

    // Convert to PNG and resize to 32x32
    const pngBuffer = await sharp(faviconBuffer)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Convert to base64
    const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    
    return base64;
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return null;
  }
}

/**
 * Download image from URL
 */
function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { timeout: 5000 }, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      const chunks: Buffer[] = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      response.on('error', () => {
        resolve(null);
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Parse HTML to find favicon link
 */
async function findFaviconInHTML(urlString: string): Promise<string | null> {
  try {
    const html = await downloadHTML(urlString);
    if (!html) return null;

    // Look for favicon link in HTML
    const iconRegex = /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i;
    const match = html.match(iconRegex);

    if (!match || !match[1]) return null;

    let faviconPath = match[1];
    
    // Handle relative URLs
    if (faviconPath.startsWith('//')) {
      const url = new URL(urlString);
      faviconPath = `${url.protocol}${faviconPath}`;
    } else if (faviconPath.startsWith('/')) {
      const url = new URL(urlString);
      faviconPath = `${url.protocol}//${url.hostname}${faviconPath}`;
    } else if (!faviconPath.startsWith('http')) {
      const url = new URL(urlString);
      faviconPath = `${url.protocol}//${url.hostname}/${faviconPath}`;
    }

    return faviconPath;
  } catch (error) {
    return null;
  }
}

/**
 * Download HTML content
 */
function downloadHTML(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { timeout: 5000 }, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      let html = '';
      
      response.on('data', (chunk) => {
        html += chunk.toString();
        // Only need the head section
        if (html.includes('</head>')) {
          response.destroy();
        }
      });

      response.on('end', () => {
        resolve(html);
      });

      response.on('error', () => {
        resolve(null);
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

