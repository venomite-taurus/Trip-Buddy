import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {};
  const query = "Accord Puducherry";

  // Test 1: DuckDuckGo Scraper
  try {
    const mainUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const mainRes = await fetch(mainUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const html = await mainRes.text();
    const vqdRegex = /vqd=["']([^"']+)["']/i;
    const match = html.match(vqdRegex);
    results.ddg = {
      status: mainRes.status,
      vqdFound: !!match,
      htmlLength: html.length,
      snippet: html.slice(0, 500)
    };
  } catch (err: any) {
    results.ddg = { error: err.message };
  }

  // Test 2: Bing Scraper
  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
    const bingRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const html = await bingRes.text();
    const regex = /m="([^"]+)"/g;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      try {
        const decoded = match[1].replace(/&quot;/g, '"');
        const parsed = JSON.parse(decoded);
        if (parsed.murl) urls.push(parsed.murl);
      } catch (e) {}
    }
    results.bing = {
      status: bingRes.status,
      htmlLength: html.length,
      imageCount: urls.length,
      first5: urls.slice(0, 5)
    };
  } catch (err: any) {
    results.bing = { error: err.message };
  }

  // Test 3: Yahoo Scraper
  try {
    const url = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}`;
    const yahooRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const html = await yahooRes.text();
    const regex = /"iurl":"([^"]+)"/g;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      const imgUrl = match[1].replace(/\\/g, '');
      if (imgUrl.startsWith('http')) urls.push(imgUrl);
    }
    results.yahoo = {
      status: yahooRes.status,
      htmlLength: html.length,
      imageCount: urls.length,
      first5: urls.slice(0, 5)
    };
  } catch (err: any) {
    results.yahoo = { error: err.message };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results, null, 2));
}
