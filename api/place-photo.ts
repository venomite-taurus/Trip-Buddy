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

  // Helper function to redirect directly to a scraped image by name
  const serveScrapedImage = async (name: string, index: number, category?: string, city?: string) => {
    try {
      const urls = await resolveScrapedImageUrls(name, category, city);
      if (urls && urls.length > 0) {
        const urlIndex = index % urls.length;
        const imageUrl = urls[urlIndex];
        res.writeHead(302, { 
          'Location': imageUrl,
          'Cache-Control': 'public, max-age=86400'
        });
        res.end();
        return true;
      }
    } catch (err) {
      console.error(`resolveScrapedImageUrls failed for ${name}:`, err);
    }
    return false;
  };

  // Handle search-photo ref: directly 302 redirect the browser to the crawled image URL
  if (ref.startsWith('search-photo:')) {
    const parts = ref.split(':');
    let name = '';
    let city = '';
    let category = '';
    let index = 0;

    if (parts.length >= 5) {
      name = decodeURIComponent(parts[1] || '');
      city = decodeURIComponent(parts[2] || '');
      category = decodeURIComponent(parts[3] || '');
      index = parseInt(parts[4] || '0', 10);
    } else {
      name = decodeURIComponent(parts[1] || '');
      index = parseInt(parts[2] || '0', 10);
      category = categoryParam;
      city = url.searchParams.get('city') || '';
    }

    const success = await serveScrapedImage(name, index, category, city);
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
      const headers: Record<string, string> = {
        'Cache-Control': 'public, max-age=86400'
      };
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
      const cityVal = url.searchParams.get('city') || '';
      const success = await serveScrapedImage(nameParam, 0, categoryParam, cityVal);
      if (success) return;
    }
    
    res.writeHead(302, { 'Location': fallbackUrl });
    res.end();
  } catch (e: any) {
    console.error(`Google photo proxy failed:`, e);
    if (nameParam) {
      const cityVal = url.searchParams.get('city') || '';
      const success = await serveScrapedImage(nameParam, 0, categoryParam, cityVal);
      if (success) return;
    }
    res.writeHead(302, { 'Location': fallbackUrl });
    res.end();
  }
}
