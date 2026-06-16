import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const query = "Taj Mahal";
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  
  const bingRes = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  });
  const html = await bingRes.text();

  // Find all URLs matching .jpg or .png or .jpeg
  const regex = /(https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png))/gi;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const u = match[1];
    if (!urls.includes(u) && !u.includes('bing.com') && !u.includes('microsoft.com')) {
      urls.push(u);
    }
  }

  // Also extract anything that looks like an image container tag (e.g. iusc, dg_u, etc.)
  const iuscMatches: string[] = [];
  const iuscRegex = /<a[^>]+class="iusc"[^>]*>/g;
  let iuscMatch;
  while ((iuscMatch = iuscRegex.exec(html)) !== null && iuscMatches.length < 5) {
    iuscMatches.push(iuscMatch[0]);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: bingRes.status,
    htmlLength: html.length,
    foundUrlsCount: urls.length,
    first10_urls: urls.slice(0, 10),
    iuscMatches: iuscMatches
  }, null, 2));
}
