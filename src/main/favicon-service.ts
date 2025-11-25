import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';

/**
 * Fetch favicon from URL and convert to base64
 */
export async function fetchFavicon(urlString: string): Promise<string | null> {
  console.log('🔍 Starting favicon fetch for:', urlString);
  // Add overall timeout of 8 seconds
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.log('⏱️ Favicon fetch timeout for:', urlString);
      resolve(null);
    }, 8000);
  });

  const fetchPromise = (async () => {
    try {
      const url = new URL(urlString);
      const baseUrl = `${url.protocol}//${url.hostname}`;

    let faviconBuffer: Buffer | null = null;

    // Strategy 1: Apple Touch Icons (HIGHEST PRIORITY - what browsers actually use)
    // These are high-res (120-180px) and widely supported
    const appleTouchPaths = [
      `${baseUrl}/apple-touch-icon.png`,
      `${baseUrl}/apple-touch-icon-180x180.png`,
      `${baseUrl}/apple-touch-icon-152x152.png`,
      `${baseUrl}/apple-touch-icon-precomposed.png`,
      `${baseUrl}/apple-touch-icon-120x120.png`,
    ];
    
    for (const applePath of appleTouchPaths) {
      if (faviconBuffer) break;
      try {
        console.log(`🍎 Strategy 1: Apple Touch Icon: ${applePath}`);
        faviconBuffer = await downloadImage(applePath);
        if (faviconBuffer) {
          console.log('✅ Got Apple Touch Icon');
          break;
        }
      } catch (e) {
        // Try next path
      }
    }

    // Strategy 2: Parse HTML for <link rel="icon"> (what browsers check second)
    if (!faviconBuffer) {
      try {
        console.log('📄 Strategy 2: Parsing HTML for <link rel="icon">...');
        const faviconUrl = await findFaviconInHTML(urlString);
        if (faviconUrl) {
          console.log(`✅ Found in HTML: ${faviconUrl}`);
          faviconBuffer = await downloadImage(faviconUrl);
          if (faviconBuffer) console.log('✅ Downloaded from HTML link');
        }
      } catch (e) {
        console.log('❌ HTML parsing failed');
      }
    }

    // Strategy 3: Root /favicon.ico (legacy fallback)
    if (!faviconBuffer) {
      try {
        const faviconUrl = `${baseUrl}/favicon.ico`;
        console.log(`📁 Strategy 3: Root /favicon.ico`);
        faviconBuffer = await downloadImage(faviconUrl);
        if (faviconBuffer) console.log('✅ Got /favicon.ico');
      } catch (e) {
        console.log('❌ /favicon.ico not found');
      }
    }

    // Strategy 4: Google favicon service (last resort)
    if (!faviconBuffer) {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
        console.log(`🔵 Strategy 4: Google favicon service`);
        faviconBuffer = await downloadImage(googleUrl);
        if (faviconBuffer) console.log('✅ Got from Google');
      } catch (e) {
        console.log('❌ Google failed');
      }
    }

    if (!faviconBuffer) {
      console.log('No favicon found for:', urlString);
      return null;
    }

    // Detect format first
    const format = detectImageFormat(faviconBuffer);
    console.log(`📊 Detected format: ${format}`);
    
    // For ICO files, skip Sharp and continue to HTML parsing (which will find PNG versions)
    if (format === 'x-icon') {
      console.log('⚠️ ICO format detected - skipping to HTML parsing for PNG version');
      faviconBuffer = null; // Clear to trigger HTML parsing strategy below
    }
    
    // Try to convert to PNG and resize to 32x32 (if we have a buffer)
    if (faviconBuffer) {
      try {
        console.log(`📊 Original buffer size: ${faviconBuffer.length} bytes`);
        const pngBuffer = await sharp(faviconBuffer)
          .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        console.log(`📊 Converted PNG buffer size: ${pngBuffer.length} bytes`);
        // Convert to base64
        const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;
        console.log(`📊 Final base64 string length: ${base64.length} characters`);
        console.log('✅ Successfully converted favicon to PNG');
        return base64;
      } catch (sharpError) {
        console.log('⚠️ Sharp conversion failed:', sharpError);
        // Clear buffer to try HTML parsing
        faviconBuffer = null;
      }
    }
    } catch (error) {
      console.error('Error fetching favicon:', error);
      return null;
    }
  })();

  // Race between fetch and timeout
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Detect image format from buffer using magic numbers
 */
function detectImageFormat(buffer: Buffer): string | null {
  // Check magic numbers (first few bytes of file)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'gif';
  }
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'x-icon'; // .ico format
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'webp';
  }
  if (buffer.toString('utf8', 0, 4) === '<svg' || buffer.toString('utf8', 0, 5) === '<?xml') {
    return 'svg+xml';
  }
  return null;
}

/**
 * Download image from URL
 */
function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      timeout: 2000, // Reduced timeout - favicon should be fast
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    const request = protocol.get(url, options, (response) => {
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

    // Look for various types of icon links in HTML
    // Try to find the largest or most standard icon
    const iconPatterns = [
      // Standard icon with sizes (prefer 32x32, 96x96, or larger)
      /<link[^>]*rel=["']icon["'][^>]*sizes=["'](?:32x32|96x96|128x128|192x192)["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*sizes=["'](?:32x32|96x96|128x128|192x192)["']/i,
      // Any icon with type image/png
      /<link[^>]*rel=["']icon["'][^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i,
      // Standard favicon (any size)
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      // Reverse order (href before rel)
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      // Apple touch icon as fallback (prefer larger sizes)
      /<link[^>]*rel=["']apple-touch-icon["'][^>]*sizes=["'](?:120x120|144x144|152x152|180x180)["'][^>]*href=["']([^"']+)["']/i,
      /<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
    ];

    for (const pattern of iconPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
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

        console.log(`Found favicon link: ${faviconPath}`);
        return faviconPath;
      }
    }

    return null;
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
    
    const options = {
      timeout: 3000, // Reduced timeout for HTML parsing
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    const request = protocol.get(url, options, (response) => {
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

