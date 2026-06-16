import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import url from 'url'
import { generateRecommendations, fetchPlaceDetails, resolveScrapedImageUrls } from './src/server/recommendationEngine'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  const GOOGLE_API_KEY = env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_oN1f6XdmfWiXDtA7IKLp0ppMyUeePWU'

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'vite-backend-proxy',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const parsedUrl = url.parse(req.url || '', true)
            const pathname = parsedUrl.pathname
            const query = parsedUrl.query

            // 1. Google Places Autocomplete API proxy (restricted to India)
            if (pathname === '/api/places-autocomplete') {
              const input = query.input as string
              if (!input) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'input query param is required' }))
                return
              }
              const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:in&key=${GOOGLE_API_KEY}`
              try {
                const response = await fetch(autocompleteUrl)
                const data = await response.json()
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(data))
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: e.message }))
              }
              return
            }

            // 2. Trip Recommendations Generator Endpoint
            if (pathname === '/api/recommendations') {
              if (req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Method Not Allowed' }))
                return
              }

              let body = ''
              req.on('data', chunk => { body += chunk })
              req.on('end', async () => {
                try {
                  const prefs = JSON.parse(body)
                  const results = await generateRecommendations(prefs, GOOGLE_API_KEY)
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify(results))
                } catch (e: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: e.message }))
                }
              })
              return
            }

            // 3. Place Details API proxy
            if (pathname === '/api/place-details') {
              const placeId = query.place_id as string
              if (!placeId) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'place_id query param is required' }))
                return
              }
              try {
                const details = await fetchPlaceDetails(placeId, GOOGLE_API_KEY)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(details))
              } catch (e: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: e.message }))
              }
              return
            }

            // 4. Secure Place Photo Proxy (hides API key from img src URLs)
            if (pathname === '/api/place-photo') {
              const ref = query.ref as string
              const nameParam = query.name as string
              
              if (!ref) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'ref query param is required' }))
                return
              }

              // Helper function to serve a scraped image by name
              const serveScrapedImage = async (name: string, index: number, category?: string, city?: string) => {
                try {
                  const urls = await resolveScrapedImageUrls(name, category, city);
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
                  category = (query.category as string) || '';
                  city = (query.city as string) || '';
                }

                const success = await serveScrapedImage(name, index, category, city);
                if (success) return;
                
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No image found' }));
                return;
              }
              
              let photoUrl = '';
              if (ref.includes('places/') && ref.includes('/photos/')) {
                photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
              } else {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_API_KEY}`;
              }

              try {
                const response = await fetch(photoUrl)
                if (response.status === 200) {
                  const buffer = await response.arrayBuffer()
                  const headers: Record<string, string> = {}
                  const contentType = response.headers.get('content-type')
                  if (contentType) {
                    headers['Content-Type'] = contentType
                  }
                  res.writeHead(200, headers)
                  res.end(Buffer.from(buffer))
                  return;
                }
                
                console.warn(`Google photo fetch returned status ${response.status}. Attempting search scraping fallback...`);
                if (nameParam) {
                  const categoryVal = (query.category as string) || '';
                  const cityVal = (query.city as string) || '';
                  const success = await serveScrapedImage(nameParam, 0, categoryVal, cityVal);
                  if (success) return;
                }
                
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No image found' }));
              } catch (e: any) {
                console.error(`Google photo proxy failed:`, e);
                if (nameParam) {
                  const categoryVal = (query.category as string) || '';
                  const cityVal = (query.city as string) || '';
                  const success = await serveScrapedImage(nameParam, 0, categoryVal, cityVal);
                  if (success) return;
                }
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'No image found' }))
              }
              return
            }

            next()
          })
        }
      }
    ]
  }
})
