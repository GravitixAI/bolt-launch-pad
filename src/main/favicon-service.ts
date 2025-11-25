import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';

/**
 * Fetch favicon from URL and convert to base64
 */
export async function fetchFavicon(urlString: string): Promise<string | null> {
  // Add overall timeout of 10 seconds
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.log('Favicon fetch timeout for:', urlString);
      resolve(null);
    }, 10000);
  });

  const fetchPromise = (async () => {
    try {
      const url = new URL(urlString);
      const baseUrl = `${url.protocol}//${url.hostname}`;

    let faviconBuffer: Buffer | null = null;

    // Strategy 1: Try to parse HTML for favicon link first (most accurate)
    try {
      const faviconUrl = await findFaviconInHTML(urlString);
      if (faviconUrl) {
        console.log(`Found favicon in HTML: ${faviconUrl}`);
        faviconBuffer = await downloadImage(faviconUrl);
      }
    } catch (e) {
      console.log('HTML parsing for favicon failed');
    }

    // Strategy 2: Try /favicon.ico
    if (!faviconBuffer) {
      try {
        const faviconUrl = `${baseUrl}/favicon.ico`;
        console.log(`Trying direct favicon: ${faviconUrl}`);
        faviconBuffer = await downloadImage(faviconUrl);
      } catch (e) {
        console.log('Direct favicon.ico failed');
      }
    }

    // Strategy 3: Try Google's favicon service with larger size
    if (!faviconBuffer) {
      try {
        const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
        console.log(`Trying Google favicon service: ${googleFaviconUrl}`);
        faviconBuffer = await downloadImage(googleFaviconUrl);
      } catch (e) {
        console.log('Google favicon service failed');
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
      timeout: 5000,
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
    const iconPatterns = [
      // Standard favicon
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
      // Reverse order (href before rel)
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      // Apple touch icon
      /<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
      // Reverse apple touch icon
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon[^"']*["']/i,
      // PNG icon specifically
      /<link[^>]*type=["']image\/png["'][^>]*href=["']([^"']+)["']/i,
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
      timeout: 5000,
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

