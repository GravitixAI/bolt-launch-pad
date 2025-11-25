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

    // Strategy 1: Try Google's favicon service FIRST (fastest and most reliable)
    try {
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
      console.log(`🔵 Strategy 1: Google favicon service: ${googleFaviconUrl}`);
      faviconBuffer = await downloadImage(googleFaviconUrl);
      if (faviconBuffer) console.log('✅ Got favicon from Google');
    } catch (e) {
      console.log('❌ Google favicon service failed');
    }

    // Strategy 2: Try /favicon.ico
    if (!faviconBuffer) {
      try {
        const faviconUrl = `${baseUrl}/favicon.ico`;
        console.log(`📁 Strategy 2: Direct favicon: ${faviconUrl}`);
        faviconBuffer = await downloadImage(faviconUrl);
        if (faviconBuffer) console.log('✅ Got favicon from /favicon.ico');
      } catch (e) {
        console.log('❌ Direct favicon.ico failed');
      }
    }

    // Strategy 3: Try to parse HTML for favicon link (slowest, but most accurate)
    if (!faviconBuffer) {
      try {
        console.log('📄 Strategy 3: Parsing HTML...');
        const faviconUrl = await findFaviconInHTML(urlString);
        if (faviconUrl) {
          console.log(`✅ Found favicon in HTML: ${faviconUrl}`);
          faviconBuffer = await downloadImage(faviconUrl);
          if (faviconBuffer) console.log('✅ Downloaded favicon from HTML link');
        } else {
          console.log('❌ No favicon link found in HTML');
        }
      } catch (e) {
        console.log('❌ HTML parsing failed:', e);
      }
    }

    // Strategy 4: Try alternative favicon locations
    if (!faviconBuffer) {
      const alternativeLocations = [
        `${baseUrl}/favicon.png`,
        `${baseUrl}/apple-touch-icon.png`,
        `${baseUrl}/apple-touch-icon-precomposed.png`,
      ];
      
      for (const location of alternativeLocations) {
        try {
          console.log(`Trying alternative location: ${location}`);
          faviconBuffer = await downloadImage(location);
          if (faviconBuffer) break;
        } catch (e) {
          continue;
        }
      }
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
  })();

  // Race between fetch and timeout
  return Promise.race([fetchPromise, timeoutPromise]);
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

