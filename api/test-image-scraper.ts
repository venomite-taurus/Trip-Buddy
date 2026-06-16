import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {};
  const query = "Accord Puducherry";

  // Test 8: DuckDuckGo HTML-only search
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    results.ddg_html = {
      status: res.status,
      htmlLength: html.length,
      title: html.match(/<title>([^<]+)<\/title>/i)?.[1] || 'No Title',
      snippet: html.slice(0, 1000)
    };
  } catch (err: any) {
    results.ddg_html = { error: err.message };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results, null, 2));
}
