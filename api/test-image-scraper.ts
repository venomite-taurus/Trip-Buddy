import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {};
  const query = "Accord Puducherry";

  // Test 7: Qwant Image Search API
  try {
    const url = `https://api.qwant.com/v3/search/images?q=${encodeURIComponent(query)}&count=5&locale=en_US`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text.slice(0, 500) };
    }
    
    const urls = [];
    if (data.data && data.data.result && data.data.result.items) {
      for (const item of data.data.result.items) {
        if (item.media) {
          urls.push(item.media);
        }
      }
    }

    results.qwant = {
      status: res.status,
      count: urls.length,
      first5: urls.slice(0, 5),
      rawSnippet: text.slice(0, 500)
    };
  } catch (err: any) {
    results.qwant = { error: err.message };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results, null, 2));
}
