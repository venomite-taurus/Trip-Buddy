import type { IncomingMessage, ServerResponse } from 'http';
import { generateRecommendations } from '../src/server/recommendationEngine';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU';

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const prefs = JSON.parse(body);
    const results = await generateRecommendations(prefs, GOOGLE_API_KEY);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
  } catch (e: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}
