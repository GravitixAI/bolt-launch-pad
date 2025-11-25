import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';

/**
 * Fetch favicon from URL and convert to base64
 */
export async function fetchFavicon(urlString: string): Promise<string | null> {
  console.log('🔍 Starting favicon fetch for:', urlString);
  // Add overall timeout of 15 seconds (HTML parsing can be slow)
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      console.log('⏱️ Favicon fetch timeout (15s) for:', urlString);
      resolve(null);
    }, 15000);
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
        const buffer = await downloadImage(applePath);
        // Validate that we got a real image (at least 500 bytes for a proper icon)
        if (buffer && buffer.length >= 500) {
          console.log(`✅ Got valid Apple Touch Icon (${buffer.length} bytes)`);
          faviconBuffer = buffer;
          break;
        } else if (buffer) {
          console.log(`⚠️ Apple Touch Icon too small (${buffer.length} bytes) - probably corrupt/redirect`);
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
          const buffer = await downloadImage(faviconUrl);
          const isIco = faviconUrl.endsWith('.ico');
          const minSize = isIco ? 200 : 500; // ICO files can be smaller
          if (buffer && buffer.length >= minSize) {
            console.log(`✅ Downloaded valid image from HTML link (${buffer.length} bytes)`);
            faviconBuffer = buffer;
          } else if (buffer) {
            console.log(`⚠️ HTML icon too small (${buffer.length} bytes, min: ${minSize}) - skipping`);
          }
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
        const buffer = await downloadImage(faviconUrl);
        // ICO files can be legitimately small (200+ bytes is valid)
        if (buffer && buffer.length >= 200) {
          console.log(`✅ Got valid /favicon.ico (${buffer.length} bytes)`);
          faviconBuffer = buffer;
        } else if (buffer) {
          console.log(`⚠️ favicon.ico too small (${buffer.length} bytes) - skipping`);
        }
      } catch (e) {
        console.log('❌ /favicon.ico not found');
      }
    }

    // Strategy 4: Google favicon service (last resort)
    if (!faviconBuffer) {
      try {
        const googleUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
        console.log(`🔵 Strategy 4: Google favicon service`);
        const buffer = await downloadImage(googleUrl);
        if (buffer && buffer.length >= 200) {
          // Google service returns smaller but valid PNGs
          console.log(`✅ Got from Google (${buffer.length} bytes)`);
          faviconBuffer = buffer;
        } else if (buffer) {
          console.log(`⚠️ Google icon too small (${buffer.length} bytes)`);
        }
      } catch (e) {
        console.log('❌ Google failed');
      }
    }

    if (!faviconBuffer) {
      console.log('No favicon found for:', urlString);
      return null;
    }

    // Detect format
    const format = detectImageFormat(faviconBuffer);
    console.log(`📊 Detected format: ${format}`);
    
    // Try to convert to PNG and resize to 32x32
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
        console.error('⚠️ Sharp conversion failed:', sharpError);
        console.error('📍 Catch block entered - attempting Google fallback');
        // Try multiple fallback services for problematic ICO files
        console.log('🔄 Trying fallback favicon services...');
        
        // Try icon.horse first (often more reliable)
        try {
          const iconHorseUrl = `https://icon.horse/icon/${url.hostname}`;
          console.log(`🐴 Trying icon.horse: ${iconHorseUrl}`);
          const iconHorseBuffer = await downloadImage(iconHorseUrl);
          console.log(`📦 Icon.horse buffer: ${iconHorseBuffer ? iconHorseBuffer.length : 'NULL'} bytes`);
          if (iconHorseBuffer && iconHorseBuffer.length >= 200) {
            const pngBuffer = await sharp(iconHorseBuffer)
              .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer();
            console.log('✅ Icon.horse fallback succeeded');
            return `data:image/png;base64,${pngBuffer.toString('base64')}`;
          }
        } catch (iconHorseError) {
          console.log('❌ Icon.horse failed:', iconHorseError.message);
        }
        
        // Try Google as secondary fallback
        try {
          const googleUrl = `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
          console.log(`🔵 Trying Google: ${googleUrl}`);
          const googleBuffer = await downloadImage(googleUrl);
          console.log(`📦 Google buffer: ${googleBuffer ? googleBuffer.length : 'NULL'} bytes`);
          if (googleBuffer && googleBuffer.length >= 100) { // Google returns smaller files
            const pngBuffer = await sharp(googleBuffer)
              .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png()
              .toBuffer();
            console.log('✅ Google fallback succeeded');
            return `data:image/png;base64,${pngBuffer.toString('base64')}`;
          }
        } catch (googleError) {
          console.log('❌ Google failed:', googleError.message);
        }
        console.log('❌ Returning null from Sharp catch block');
        return null;
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
  console.log('📞 findFaviconInHTML called for:', urlString);
  try {
    console.log('⏳ About to download HTML...');
    const html = await downloadHTML(urlString);
    console.log('📥 HTML download returned, length:', html ? html.length : 'NULL');
    if (!html) return null;

    console.log('🔍 Parsing HTML for icon links...');
    
    // Extract all <link> tags at once (much faster than multiple regex passes)
    const linkTagRegex = /<link[^>]+>/gi;
    const linkTags = html.match(linkTagRegex) || [];
    console.log(`📋 Found ${linkTags.length} <link> tags`);

    // Parse each link tag for icon-related attributes
    const iconCandidates: Array<{ href: string; size: number; type: string }> = [];

    for (const tag of linkTags) {
      const relMatch = tag.match(/rel=["']([^"']+)["']/i);
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
      const sizesMatch = tag.match(/sizes=["'](\d+)x\d+["']/i);
      const typeMatch = tag.match(/type=["']([^"']+)["']/i);

      if (!relMatch || !hrefMatch) continue;

      const rel = relMatch[1].toLowerCase();
      const href = hrefMatch[1];
      const size = sizesMatch ? parseInt(sizesMatch[1]) : 0;
      const type = typeMatch ? typeMatch[1] : '';

      // Look for icon or apple-touch-icon
      if (rel.includes('icon')) {
        iconCandidates.push({ href, size, type });
      }
    }

    console.log(`🎯 Found ${iconCandidates.length} icon candidates`);

    if (iconCandidates.length === 0) {
      console.log('❌ No favicon link found in HTML');
      return null;
    }

    // Sort by preference: PNG first, then ICO, then by size (prefer 32-128px range)
    iconCandidates.sort((a, b) => {
      // Prefer PNG (best quality)
      if (a.type.includes('png') && !b.type.includes('png')) return -1;
      if (!a.type.includes('png') && b.type.includes('png')) return 1;
      
      // Then prefer ICO (traditional favicon format)
      const aIsIco = a.type.includes('x-icon') || a.href.endsWith('.ico');
      const bIsIco = b.type.includes('x-icon') || b.href.endsWith('.ico');
      if (aIsIco && !bIsIco) return -1;
      if (!aIsIco && bIsIco) return 1;
      
      // Prefer sizes in the 32-128 range
      const aInRange = a.size >= 32 && a.size <= 128;
      const bInRange = b.size >= 32 && b.size <= 128;
      if (aInRange && !bInRange) return -1;
      if (!aInRange && bInRange) return 1;
      
      // Otherwise prefer larger
      return b.size - a.size;
    });

    // Take the best candidate
    let faviconPath = iconCandidates[0].href;
    console.log(`✅ Selected icon: ${faviconPath} (size: ${iconCandidates[0].size}, type: ${iconCandidates[0].type})`);

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

    console.log(`🔗 Resolved to: ${faviconPath}`);
    return faviconPath;
  } catch (error) {
    console.error('❌ CRITICAL Error parsing HTML:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
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
      timeout: 8000, // Increased timeout for slow sites like NASA
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    
    console.log('📥 Downloading HTML from:', url);
    const request = protocol.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log('↪️ Following redirect to:', redirectUrl);
          resolve(downloadHTML(redirectUrl));
          return;
        }
      }

      if (response.statusCode !== 200) {
        console.log(`❌ HTML download failed: HTTP ${response.statusCode}`);
        resolve(null);
        return;
      }

      let html = '';
      let bytesReceived = 0;
      
      response.on('data', (chunk) => {
        html += chunk.toString();
        bytesReceived += chunk.length;
        // Only need the head section (stop early to save time)
        if (html.includes('</head>')) {
          console.log(`✅ Got HTML head section (${bytesReceived} bytes) - resolving early`);
          resolve(html); // Resolve BEFORE destroying
          response.destroy();
        }
      });

      response.on('end', () => {
        console.log(`✅ HTML download complete (${bytesReceived} bytes total)`);
        resolve(html);
      });

      response.on('error', (err) => {
        console.log('❌ HTML download error:', err.message);
        resolve(null);
      });
    });

    request.on('error', (err) => {
      console.log('❌ HTML request error:', err.message);
      resolve(null);
    });

    request.on('timeout', () => {
      console.log('⏱️ HTML download timeout');
      request.destroy();
      resolve(null);
    });
  });
}

