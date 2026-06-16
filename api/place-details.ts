import type { IncomingMessage, ServerResponse } from 'http';
import { fetchPlaceDetails } from '../src/server/recommendationEngine';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU';

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const placeId = url.searchParams.get('place_id');
    
    if (!placeId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'place_id query param is required' }));
      return;
    }

    const details = await fetchPlaceDetails(placeId, GOOGLE_API_KEY);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(details));
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}
