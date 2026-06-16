import type { IncomingMessage, ServerResponse } from 'http';
import { resolveScrapedImageUrls } from '../src/server/recommendationEngine';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU';

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const ref = url.searchParams.get('ref');
  const nameParam = url.searchParams.get('name');
  const categoryParam = url.searchParams.get('category') || '';

  const fallbacks: Record<string, string> = {
    stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    eat: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
    visit: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
    roam: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
    transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
    rental: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    agency: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
  };
  const fallbackUrl = fallbacks[categoryParam] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

  if (!ref) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'ref query param is required' }));
    return;
  }

  // Helper function to serve a scraped image by name
  const serveScrapedImage = async (name: string, index: number) => {
    try {
      const urls = await resolveScrapedImageUrls(name);
      if (urls && urls.length > 0) {
        for (let attempt = 0; attempt < Math.min(urls.length, 3); attempt++) {
          const urlIndex = (index + attempt) % urls.length;
          const imageUrl = urls[urlIndex];
          try {
            const imgRes = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
              },
              signal: AbortSignal.timeout(5000)
            });
            if (imgRes.status === 200) {
              const buffer = await imgRes.arrayBuffer();
              const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
              res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
              });
              res.end(Buffer.from(buffer));
              return true;
            }
          } catch (fetchErr) {
            console.warn(`Failed to fetch image ${imageUrl} for ${name}:`, fetchErr);
          }
        }
      }
    } catch (err) {
      console.error(`resolveScrapedImageUrls failed for ${name}:`, err);
    }
    return false;
  };

  // Handle search-photo ref
  if (ref.startsWith('search-photo:')) {
    const parts = ref.split(':');
    const name = decodeURIComponent(parts[1] || '');
    const index = parseInt(parts[2] || '0', 10);
    const success = await serveScrapedImage(name, index);
    if (success) return;
    
    // Redirect to fallback if scraping fails
    res.writeHead(302, { 'Location': fallbackUrl });
    res.end();
    return;
  }
  
  let photoUrl = '';
  if (ref.includes('places/') && ref.includes('/photos/')) {
    photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
  } else {
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
  }

  try {
    const response = await fetch(photoUrl);
    if (response.status === 200) {
      const buffer = await response.arrayBuffer();
      const headers: Record<string, string> = {};
      const contentType = response.headers.get('content-type');
      if (contentType) {
        headers['Content-Type'] = contentType;
      }
      res.writeHead(200, headers);
      res.end(Buffer.from(buffer));
      return;
    }
    
    console.warn(`Google photo fetch returned status ${response.status}. Attempting search scraping fallback...`);
    if (nameParam) {
      const success = await serveScrapedImage(nameParam, 0);
      if (success) return;
    }
    
    res.writeHead(302, { 'Location': fallbackUrl });
    res.end();
  } catch (e: any) {
    console.error(`Google photo proxy failed:`, e);
    if (nameParam) {
      const success = await serveScrapedImage(nameParam, 0);
      if (success) return;
    }
    res.writeHead(302, { 'Location': fallbackUrl });
    res.end();
  }
}
