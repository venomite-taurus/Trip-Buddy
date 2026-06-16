import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU';
  
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const input = url.searchParams.get('input');
    
    if (!input) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'input query param is required' }));
      return;
    }

    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&key=${GOOGLE_API_KEY}`;
    const response = await fetch(autocompleteUrl);
    const data = await response.json();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}
