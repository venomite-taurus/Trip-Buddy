import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {};
  const query = "Accord Puducherry";

  // Test 4: Google Images (Standard Desktop)
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const html = await res.slice ? '' : await res.text();
    
    // Look for image source URLs
    // Google Images often contains: [,["https://...",...]] or similar JSON array structures, or img src="https://encrypted-tbn0.gstatic.com/..."
    const gstaticRegex = /src="([^"]+gstatic\.com\/images\?q=tbn:[^"]+)"/g;
    const gstaticUrls = [];
    let match;
    while ((match = gstaticRegex.exec(html)) !== null) {
      gstaticUrls.push(match[1]);
    }

    // Also look for full resolution image URLs in the script tags.
    // They are usually in format: ["http...",width,height] or similar.
    const urlRegex = /(https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|gif))/gi;
    const foundUrls = [];
    let urlMatch;
    while ((urlMatch = urlRegex.exec(html)) !== null) {
      const u = urlMatch[1];
      if (u.includes('gstatic.com') || u.includes('google.com') || u.includes('googleadservices')) continue;
      if (!foundUrls.includes(u)) foundUrls.push(u);
    }

    results.google_standard = {
      status: res.status,
      htmlLength: html.length,
      gstaticCount: gstaticUrls.length,
      first5_gstatic: gstaticUrls.slice(0, 5),
      foundUrlsCount: foundUrls.length,
      first5_found: foundUrls.slice(0, 5),
      title: html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'No Title'
    };
  } catch (err: any) {
    results.google_standard = { error: err.message };
  }

  // Test 5: Google Images (No User Agent)
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    const res = await fetch(url);
    const html = await res.text();
    const gstaticRegex = /src="([^"]+gstatic\.com\/images\?q=tbn:[^"]+)"/g;
    const gstaticUrls = [];
    let match;
    while ((match = gstaticRegex.exec(html)) !== null) {
      gstaticUrls.push(match[1]);
    }
    results.google_no_ua = {
      status: res.status,
      htmlLength: html.length,
      gstaticCount: gstaticUrls.length,
      first5: gstaticUrls.slice(0, 5),
      title: html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'No Title'
    };
  } catch (err: any) {
    results.google_no_ua = { error: err.message };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results, null, 2));
}
