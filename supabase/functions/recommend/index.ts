// Supabase Edge Function for Trip Buddy recommendations
// Deploy using: supabase functions deploy recommend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface TripPreferences {
  destination: string;
  days: number;
  radius: number; // in km
  budgetType: 'total' | 'per_day';
  budgetValue: number;
  stayBudgetCategory: 'budget' | 'mid-range' | 'luxury';
  foodBudgetCategory: 'street' | 'mid-range' | 'fine';
  preferences: string[];
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  travelMode: 'self-drive' | 'public' | 'rent';
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; formatted_address: string }> = {
  'goa': { lat: 15.2993, lng: 74.1240, formatted_address: 'Goa, India' },
  'jaipur': { lat: 26.9124, lng: 75.7873, formatted_address: 'Jaipur, Rajasthan, India' },
  'udaipur': { lat: 24.5854, lng: 73.7125, formatted_address: 'Udaipur, Rajasthan, India' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, formatted_address: 'Rishikesh, Uttarakhand, India' },
  'pondicherry': { lat: 11.9416, lng: 79.8083, formatted_address: 'Pondicherry, India' },
  'munnar': { lat: 10.0889, lng: 77.0595, formatted_address: 'Munnar, Kerala, India' },
  'manali': { lat: 32.2396, lng: 77.1887, formatted_address: 'Manali, Himachal Pradesh, India' },
  'delhi': { lat: 28.6139, lng: 77.2090, formatted_address: 'Delhi, India' },
  'mumbai': { lat: 19.0760, lng: 72.8777, formatted_address: 'Mumbai, Maharashtra, India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, formatted_address: 'Bengaluru, Karnataka, India' }
};

function getLocalGeocoding(destination: string): { lat: number; lng: number; formatted_address: string } {
  const norm = destination.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords;
    }
  }
  return { lat: 26.9124, lng: 75.7873, formatted_address: `${destination}, India (Demo Fallback)` };
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function clusterPlaces(places: any[], k: number): any[] {
  if (places.length === 0) return [];
  if (k <= 1 || places.length <= k) {
    return places.map((p, idx) => ({ ...p, day_number: Math.min(idx + 1, k) }));
  }

  let centroids = places.slice(0, k).map(p => ({ lat: p.lat, lng: p.lng }));
  while (centroids.length < k) {
    centroids.push({
      lat: places[0].lat + (Math.random() - 0.5) * 0.01,
      lng: places[0].lng + (Math.random() - 0.5) * 0.01
    });
  }

  let assignments = new Array(places.length).fill(0);
  let centroidsChanged = true;
  let iter = 0;

  while (centroidsChanged && iter < 10) {
    centroidsChanged = false;
    iter++;
    
    const newAssignments = places.map(p => {
      let minDist = Infinity;
      let minIdx = 0;
      centroids.forEach((c, idx) => {
        const dist = calculateDistance(p.lat, p.lng, c.lat, c.lng);
        if (dist < minDist) {
          minDist = dist;
          minIdx = idx;
        }
      });
      return minIdx;
    });

    if (newAssignments.some((val, idx) => val !== assignments[idx])) {
      assignments = newAssignments;
      centroidsChanged = true;
    }

    const clusterSizes = new Array(k).fill(0);
    const clusterSums = centroids.map(() => ({ lat: 0, lng: 0 }));

    assignments.forEach((clusterIdx, placeIdx) => {
      clusterSizes[clusterIdx]++;
      clusterSums[clusterIdx].lat += places[placeIdx].lat;
      clusterSums[clusterIdx].lng += places[placeIdx].lng;
    });

    centroids = centroids.map((c, idx) => {
      if (clusterSizes[idx] > 0) {
        return {
          lat: clusterSums[idx].lat / clusterSizes[idx],
          lng: clusterSums[idx].lng / clusterSizes[idx]
        };
      }
      return c;
    });
  }

  return places.map((p, idx) => ({ ...p, day_number: assignments[idx] + 1 }));
}

function scorePlace(
  place: any,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  category: string,
  prefs: TripPreferences
): { score: number; distance: number } {
  const lat = place.geometry?.location?.lat ?? centerLat;
  const lng = place.geometry?.location?.lng ?? centerLng;
  const distance = calculateDistance(centerLat, centerLng, lat, lng);
  
  const rating = place.rating ?? 3.5;
  const ratingScore = rating / 5.0;
  
  const reviews = place.user_ratings_total ?? 10;
  const popularityScore = Math.min(Math.log10(reviews + 1) / Math.log10(5001), 1.0);
  
  const proximityScore = Math.max(0, 1.0 - (distance / radiusKm));
  
  let budgetScore = 0.7;
  const price = place.price_level;
  if (price !== undefined) {
    if (category === 'stay') {
      const stayCat = prefs.stayBudgetCategory;
      if (stayCat === 'budget') {
        budgetScore = price <= 1 ? 1.0 : (price === 2 ? 0.5 : 0.1);
      } else if (stayCat === 'mid-range') {
        budgetScore = price === 2 ? 1.0 : (price === 1 || price === 3 ? 0.6 : 0.2);
      } else if (stayCat === 'luxury') {
        budgetScore = price >= 3 ? 1.0 : (price === 2 ? 0.5 : 0.1);
      }
    } else if (category === 'eat') {
      const foodCat = prefs.foodBudgetCategory;
      if (foodCat === 'street') {
        budgetScore = price <= 1 ? 1.0 : (price === 2 ? 0.5 : 0.1);
      } else if (foodCat === 'mid-range') {
        budgetScore = price === 2 ? 1.0 : (price === 1 || price === 3 ? 0.6 : 0.2);
      } else if (foodCat === 'fine') {
        budgetScore = price >= 3 ? 1.0 : (price === 2 ? 0.5 : 0.1);
      }
    }
  }
  
  let prefScore = 0.0;
  const types = place.types || [];
  const lowercasePrefs = prefs.preferences.map(p => p.toLowerCase());
  
  const typeMap: Record<string, string[]> = {
    nature: ['park', 'natural_feature', 'campground'],
    heritage: ['museum', 'art_gallery', 'church', 'hindu_temple', 'mosque', 'synagogue', 'monument'],
    history: ['museum', 'art_gallery', 'monument'],
    adventure: ['amusement_park', 'zoo', 'stadium'],
    spiritual: ['place_of_worship', 'hindu_temple', 'church', 'mosque', 'synagogue'],
    temples: ['place_of_worship', 'hindu_temple'],
    beaches: ['natural_feature', 'point_of_interest'],
    wildlife: ['zoo', 'aquarium', 'park'],
    shopping: ['shopping_mall', 'department_store', 'store'],
    nightlife: ['bar', 'night_club'],
    food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway']
  };

  let matchFound = false;
  for (const pref of lowercasePrefs) {
    const matchedTypes = typeMap[pref] || [];
    if (types.some((t: string) => matchedTypes.includes(t))) {
      matchFound = true;
      break;
    }
  }
  if (matchFound) prefScore = 1.0;
  
  const score = (0.35 * ratingScore) + 
                (0.20 * popularityScore) + 
                (0.20 * proximityScore) + 
                (0.15 * budgetScore) + 
                (0.10 * prefScore);
                
  return { score: Number(score.toFixed(4)), distance: Number(distance.toFixed(2)) };
}

// Generate high-quality mock recommendations customized to the city
function generateMockRecommendations(
  center: { lat: number; lng: number; formatted_address: string },
  prefs: TripPreferences
): any {
  const city = prefs.destination.split(',')[0].trim();
  
  const offsetCoord = (idx: number) => {
    const angle = (idx * 2 * Math.PI) / 10;
    const distance = 0.005 + (idx * 0.002);
    return {
      lat: center.lat + Math.sin(angle) * distance,
      lng: center.lng + Math.cos(angle) * distance
    };
  };

  // Generate Stays
  const stays: any[] = [];
  const stayNames = prefs.stayBudgetCategory === 'budget' 
    ? [`Zostel ${city}`, `${city} Backpackers Hostel`, "Greenwood Homestay", "Sandy Shore Inn", "Travellers Hub", "Banyan Tree Lodge", "Coconut Grove Homestay", "Backpackers Nest"]
    : prefs.stayBudgetCategory === 'luxury'
      ? [`The Taj Grand ${city}`, `The Leela Palace Resort`, `Oberoi Rajvilas ${city}`, "The Heritage Grand Palace", "Whispering Palms Luxury Resort", "Orchid Hill Wellness Spa", "Royal Gateway Resort", "Ocean Breeze Premium Resort"]
      : [`Heritage Palace Hotel`, `${city} Inn & Suites`, "Riverview Residency", "Central Park Hotel", "Orchard Garden Lodge", "Morning Dew Hotel", "Highland View Residency", "Royal Comfort Inn"];
  
  const stayPhotos = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80'
  ];

  for (let i = 0; i < 8; i++) {
    const coords = offsetCoord(i);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    stays.push({
      place_id: `mock-stay-${city.toLowerCase()}-${i}`,
      name: stayNames[i % stayNames.length],
      type: 'stay',
      lat: coords.lat,
      lng: coords.lng,
      address: `${10 + i}, Town Center Road, ${city}, India`,
      price_level: prefs.stayBudgetCategory === 'budget' ? 1 : prefs.stayBudgetCategory === 'luxury' ? 4 : 2,
      google_rating: Number((4.0 + (i % 10) * 0.1).toFixed(1)),
      user_ratings_total: 100 + i * 45,
      photo_refs: [stayPhotos[i % stayPhotos.length]],
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.95 - (i * 0.05)
    });
  }

  // Generate Eats
  const eats: any[] = [];
  const eatNames = prefs.foodBudgetCategory === 'street'
    ? ["Sharma Ji Ki Chai & Samosa", "Chhota Samosa Corner", "Local Dhaba Street Corner", "Bikaner Sweets & Chat", "Lassi Shop", "Pani Puri Plaza", "Tandoori Hub", "Kachori Corner"]
    : prefs.foodBudgetCategory === 'fine'
      ? ["The Royal Feast Rooftop", "Jharokha Fine Dine", "Orchid Premium Restaurant", "Golden Dragon Chinese", "The Spice Route Room", "Sea Breeze Grill room", "Heritage Courtyard Dine", "Veda Indian Cuisine"]
      : ["The Green Cafe", "Spicy Tadka Restaurant", "Bistro 19 Cafe", "Golden Harvest Cafe", "The Food Court Cafe", "Town Square Bistro", "Indian Accent Cafe", "Moti Mahal Dhaba"];
  
  const eatPhotos = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80'
  ];

  for (let i = 0; i < 10; i++) {
    const coords = offsetCoord(i + 8);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    eats.push({
      place_id: `mock-eat-${city.toLowerCase()}-${i}`,
      name: eatNames[i % eatNames.length],
      type: 'eat',
      lat: coords.lat,
      lng: coords.lng,
      address: `${24 + i}, Food Street Junction, ${city}, India`,
      price_level: prefs.foodBudgetCategory === 'street' ? 1 : prefs.foodBudgetCategory === 'fine' ? 4 : 2,
      google_rating: Number((4.1 + (i % 8) * 0.1).toFixed(1)),
      user_ratings_total: 80 + i * 35,
      photo_refs: [eatPhotos[i % eatPhotos.length]],
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.94 - (i * 0.04)
    });
  }

  // Generate Visits
  const visits: any[] = [];
  const visitNames = [
    `${city} Heritage Palace Museum`,
    `${city} Lake Sunset Viewpoint`,
    `Ancient Shiv Temple & Ghats`,
    `Waterfalls Scenic Park`,
    `Pine Forest Trekking Trail`,
    `Town Memorial & Gardens`,
    `Wildlife Sanctuary Gateway`,
    `Local Crafts Emporium`,
    `St. Mary's Cathedral Church`,
    `Central Archaeological Site`,
    `Valley View Point`,
    `Botanical Rose Gardens`
  ];

  for (let i = 0; i < 12; i++) {
    const coords = offsetCoord(i + 18);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    visits.push({
      place_id: `mock-visit-${city.toLowerCase()}-${i}`,
      name: visitNames[i % visitNames.length],
      type: 'visit',
      lat: coords.lat,
      lng: coords.lng,
      address: `${city} Sightseeing Zone, India`,
      price_level: 1,
      google_rating: Number((4.2 + (i % 7) * 0.1).toFixed(1)),
      user_ratings_total: 200 + i * 110,
      photo_refs: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=500&q=80'],
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.96 - (i * 0.03)
    });
  }

  // Generate Roams
  const roams: any[] = [];
  const roamNames = [
    `${city} Central Public Park`,
    `Old Market Shopping Square`,
    `Morning Joggers Lake Trail`,
    `Valley Breeze viewpoint`,
    `Crafts Bazaar & Street Shops`,
    `Greenwood Picnic Meadows`
  ];

  for (let i = 0; i < 6; i++) {
    const coords = offsetCoord(i + 30);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    roams.push({
      place_id: `mock-roam-${city.toLowerCase()}-${i}`,
      name: roamNames[i % roamNames.length],
      type: 'roam',
      lat: coords.lat,
      lng: coords.lng,
      address: `${city} Local Roaming Zone, India`,
      price_level: 0,
      google_rating: Number((4.0 + (i % 6) * 0.1).toFixed(1)),
      user_ratings_total: 120 + i * 40,
      photo_refs: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=500&q=80'],
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.92 - (i * 0.04)
    });
  }

  // Generate Transports
  const transports: any[] = [];
  const transportNames = [
    `${city} Main Bus Stand (ISBT)`,
    `${city} Junction Railway Station`,
    `Town Entry Toll Plaza Bus Halt`,
    `Local Scooter Rikshaw Terminal`,
    `Central Railway Crossing Stand`
  ];

  for (let i = 0; i < 5; i++) {
    const coords = offsetCoord(i + 36);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    transports.push({
      place_id: `mock-transport-${city.toLowerCase()}-${i}`,
      name: transportNames[i % transportNames.length],
      type: i === 1 || i === 4 ? 'train' : 'bus',
      lat: coords.lat,
      lng: coords.lng,
      address: `Highway Crossing, ${city}, India`,
      google_rating: Number((3.6 + (i % 4) * 0.2).toFixed(1)),
      user_ratings_total: 50 + i * 200,
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.88 - (i * 0.03)
    });
  }

  // Generate Rentals
  const rentals: any[] = [];
  const rentalNames = [
    `Royal Scooty Rentals ${city}`,
    `Vasco Bike Hires & Rides`,
    `Highway Two Wheeler Rent Shop`,
    `Speedy Bike Rental & Gear`,
    `Namaste Scooty Hire Services`
  ];

  for (let i = 0; i < 5; i++) {
    const coords = offsetCoord(i + 41);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    rentals.push({
      place_id: `mock-rental-${city.toLowerCase()}-${i}`,
      name: rentalNames[i % rentalNames.length],
      type: 'rental',
      lat: coords.lat,
      lng: coords.lng,
      address: `Town Market Road, ${city}, India`,
      google_rating: Number((4.3 + (i % 3) * 0.2).toFixed(1)),
      user_ratings_total: 35 + i * 25,
      contact_number: '',
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.90 - (i * 0.02)
    });
  }

  // Generate Agencies
  const agencies: any[] = [];
  const agencyNames = [
    `Bharat Travel Agency ${city}`,
    `Wanderlust India Tours & Travels`,
    `Namaste Tours & Sightseeing`,
    `Central Hill Agency & Guides`,
    `Explorer Travel Desk`
  ];

  for (let i = 0; i < 5; i++) {
    const coords = offsetCoord(i + 46);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    agencies.push({
      place_id: `mock-agency-${city.toLowerCase()}-${i}`,
      name: agencyNames[i % agencyNames.length],
      type: 'agency',
      lat: coords.lat,
      lng: coords.lng,
      address: `Agency Row Road, ${city}, India`,
      google_rating: Number((4.1 + (i % 4) * 0.2).toFixed(1)),
      user_ratings_total: 25 + i * 15,
      contact_number: '',
      distance_from_center: Number(dist.toFixed(2)),
      score: 0.92 - (i * 0.02)
    });
  }

  // Cluster Day wise
  const itineraryPlaces = [...visits, ...roams];
  const clusteredItinerary = clusterPlaces(itineraryPlaces, prefs.days);

  const updatedVisits = visits.map(v => {
    const found = clusteredItinerary.find(c => c.place_id === v.place_id);
    return found ? { ...v, day_number: found.day_number } : v;
  });

  const updatedRoams = roams.map(r => {
    const found = clusteredItinerary.find(c => c.place_id === r.place_id);
    return found ? { ...r, day_number: found.day_number } : r;
  });

  return {
    center,
    stays,
    eats,
    visits: updatedVisits,
    roams: updatedRoams,
    transports,
    rentals,
    agencies
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

  try {
    const prefs: TripPreferences = await req.json();
    
    // Geocode destination with local fallback
    let center;
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(prefs.destination + ', India')}&key=${GOOGLE_API_KEY}`;
      const geocodeRes = await fetch(geocodeUrl);
      const geocodeData = await geocodeRes.json();
      
      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
        center = {
          lat: geocodeData.results[0].geometry.location.lat,
          lng: geocodeData.results[0].geometry.location.lng,
          formatted_address: geocodeData.results[0].formatted_address
        };
      } else {
        center = getLocalGeocoding(prefs.destination);
      }
    } catch (_err) {
      center = getLocalGeocoding(prefs.destination);
    }

    const radiusMeters = prefs.radius * 1000;

    // Helper functions for place retrieval
    const fetchPlaces = async (type: string, keyword: string | null = null) => {
      try {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radiusMeters}&key=${GOOGLE_API_KEY}`;
        if (type) url += `&type=${type}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        return data.status === 'OK' && data.results ? data.results : [];
      } catch (_err) {
        return [];
      }
    };

    const fetchTextSearch = async (query: string) => {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${center.lat},${center.lng}&radius=${radiusMeters}&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.status === 'OK' && data.results ? data.results : [];
      } catch (_err) {
        return [];
      }
    };

    // Parallel fetch candidates
    const [
      lodgingRaw,
      restaurantRaw,
      cafeRaw,
      attractionRaw,
      museumRaw,
      parkRaw,
      worshipRaw,
      busRaw,
      trainRaw,
      rentalRaw,
      agencyRaw
    ] = await Promise.all([
      fetchPlaces('lodging'),
      fetchPlaces('restaurant'),
      fetchPlaces('cafe'),
      fetchPlaces('tourist_attraction'),
      fetchPlaces('museum'),
      fetchPlaces('park'),
      fetchPlaces('place_of_worship'),
      fetchPlaces('bus_station'),
      fetchTextSearch(`railway station near ${prefs.destination}`),
      fetchTextSearch(`bike scooty rental near ${prefs.destination}`),
      fetchPlaces('travel_agency')
    ]);

    const mapToPlace = (p: any, category: string, subType: string) => {
      const scoreAndDist = scorePlace(p, center.lat, center.lng, prefs.radius, category, prefs);
      const photoRefs = p.photos ? p.photos.map((ph: any) => ph.photo_reference) : [];
      return {
        place_id: p.place_id,
        name: p.name,
        type: subType,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        address: p.vicinity || p.formatted_address || '',
        price_level: p.price_level,
        google_rating: p.rating,
        user_ratings_total: p.user_ratings_total,
        photo_refs: photoRefs,
        distance_from_center: scoreAndDist.distance,
        score: scoreAndDist.score
      };
    };

    const stays = lodgingRaw.map(p => mapToPlace(p, 'stay', 'stay')).sort((a,b)=>b.score-a.score).slice(0,8);

    // If API requests failed or were denied (meaning stays array is empty)
    if (stays.length === 0) {
      const results = generateMockRecommendations(center, prefs);
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const eatsCombined = [...restaurantRaw, ...cafeRaw];
    const uniqueEats = Array.from(new Map(eatsCombined.map(item => [item.place_id, item])).values());
    const eats = uniqueEats.map(p => mapToPlace(p, 'eat', 'eat')).sort((a,b)=>b.score-a.score).slice(0,10);

    const visitCombined = [...attractionRaw, ...museumRaw, ...worshipRaw];
    const uniqueVisits = Array.from(new Map(visitCombined.map(item => [item.place_id, item])).values());
    const visits = uniqueVisits.map(p => mapToPlace(p, 'visit', 'visit')).sort((a,b)=>b.score-a.score).slice(0,12);

    const visitIds = new Set(visits.map(v => v.place_id));
    const roams = parkRaw
      .filter(p => !visitIds.has(p.place_id))
      .map(p => mapToPlace(p, 'roam', 'roam'))
      .sort((a,b)=>b.score-a.score)
      .slice(0,6);

    const transports = [...busRaw, ...trainRaw]
      .map(p => mapToPlace(p, 'transport', p.types && p.types.includes('train_station') ? 'train' : 'bus'))
      .sort((a,b)=>a.distance_from_center-b.distance_from_center)
      .slice(0, 5);

    const rentals = rentalRaw
      .map(p => mapToPlace(p, 'rental', 'rental'))
      .sort((a,b)=>a.distance_from_center-b.distance_from_center)
      .slice(0, 5);

    const agencies = agencyRaw
      .map(p => mapToPlace(p, 'agency', 'agency'))
      .sort((a,b)=>a.distance_from_center-b.distance_from_center)
      .slice(0, 5);

    // Day-wise clustering
    const itineraryPlaces = [...visits, ...roams];
    const clusteredItinerary = clusterPlaces(itineraryPlaces, prefs.days);

    const updatedVisits = visits.map(v => {
      const found = clusteredItinerary.find(c => c.place_id === v.place_id);
      return found ? { ...v, day_number: found.day_number } : v;
    });

    const updatedRoams = roams.map(r => {
      const found = clusteredItinerary.find(c => c.place_id === r.place_id);
      return found ? { ...r, day_number: found.day_number } : r;
    });

    const results = {
      center,
      stays,
      eats,
      visits: updatedVisits,
      roams: updatedRoams,
      transports,
      rentals,
      agencies
    };

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
