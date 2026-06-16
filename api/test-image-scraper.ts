import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const results: Record<string, any> = {};
  const query = "Accord Puducherry";

  // Test 6: Flickr Public Feed Search
  try {
    const url = `https://www.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(query)}&format=json&nojsoncallback=1`;
    const res = await fetch(url);
    const text = await res.text();
    // Flickr returns a json structure: {"items": [{"media": {"m": "https://..."}}]}
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      // In case DDG or Flickr formats it weirdly
      data = { raw: text.slice(0, 500) };
    }
    
    const urls = [];
    if (data.items) {
      for (const item of data.items) {
        if (item.media && item.media.m) {
          // Flickr media 'm' is a small thumbnail. We can convert it to a larger image URL
          // by replacing '_m.jpg' with '_b.jpg' (large size)
          const imgUrl = item.media.m.replace('_m.', '_b.');
          urls.push(imgUrl);
        }
      }
    }

    results.flickr = {
      status: res.status,
      count: urls.length,
      first5: urls.slice(0, 5),
      rawSnippet: text.slice(0, 500)
    };
  } catch (err: any) {
    results.flickr = { error: err.message };
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(results, null, 2));
}
