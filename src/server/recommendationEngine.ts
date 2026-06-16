// Trip Buddy Recommendation Engine
// Shared backend logic for Geocoding, Google Places search, Scoring, and Day-wise Clustering.
import { REAL_CITY_PLACES } from './mockData';

export interface Place {
  place_id: string;
  name: string;
  type: string; // stay, eat, visit, roam, transport, rental, agency
  lat: number;
  lng: number;
  address?: string;
  price_level?: number;
  google_rating?: number;
  user_ratings_total?: number;
  photo_refs?: string[];
  contact_number?: string;
  opening_hours?: any;
  website?: string;
  distance_from_center?: number;
  score?: number;
  day_number?: number;
  reviews?: any[];
}

export interface TripPreferences {
  destination: string;
  days: number;
  radius: number; // in km
  budgetType: 'total' | 'per_day';
  budgetValue: number;
  stayBudgetCategory: 'budget' | 'mid-range' | 'luxury';
  foodBudgetCategory: 'street' | 'mid-range' | 'fine';
  preferences: string[]; // Nature, Adventure, Spiritual, etc.
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  travelMode: 'self-drive' | 'public' | 'rent';
}

// Haversine formula to calculate distance in km between two lat/lng coordinates
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; formatted_address: string }> = {
  'goa': { lat: 15.5415, lng: 73.7631, formatted_address: 'Goa, India (Calangute / Baga Tourist Area)' },
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

export function getLocalGeocoding(destination: string): { lat: number; lng: number; formatted_address: string } {
  const norm = destination.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords;
    }
  }
  // Default fallback to Jaipur if city is unknown
  return { lat: 26.9124, lng: 75.7873, formatted_address: `${destination}, India (Demo Fallback)` };
}

// Geocode destination name to lat/lng
export async function geocodeDestination(destination: string, apiKey: string): Promise<{ lat: number; lng: number; formatted_address: string }> {
  const norm = destination.toLowerCase().trim();
  if (norm === 'goa' || norm.includes('goa, india') || norm === 'goa, india') {
    return { lat: 15.5415, lng: 73.7631, formatted_address: 'Goa, India (Calangute / Baga Tourist Area)' };
  }

  try {
    // 1. Try legacy Geocoding API first
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination + ', India')}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json() as any;
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address
      };
    }

    // 2. Fallback to Places API (New) searchText if legacy geocoding is restricted/fails
    console.warn(`Legacy geocoding returned ${data.status} for ${destination}. Trying Places API (New) searchText fallback.`);
    const newGeocodeUrl = 'https://places.googleapis.com/v1/places:searchText';
    const newGeocodeRes = await fetch(newGeocodeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify({ textQuery: destination + ', India' })
    });
    const newGeocodeData = await newGeocodeRes.json() as any;
    if (newGeocodeRes.status === 200 && newGeocodeData.places && newGeocodeData.places.length > 0) {
      const place = newGeocodeData.places[0];
      return {
        lat: place.location.latitude,
        lng: place.location.longitude,
        formatted_address: place.formattedAddress || place.displayName.text
      };
    }
    
    console.warn("Places API (New) searchText fallback geocoding failed. Falling back to local geocoder.");
    return getLocalGeocoding(destination);
  } catch (err) {
    console.warn(`Geocoding failed for ${destination} due to network error. Falling back to local geocoder.`, err);
    return getLocalGeocoding(destination);
  }
}

// Google Places Nearby Search (New)
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  type: string,
  keyword: string | null,
  apiKey: string
): Promise<any[]> {
  // If keyword is specified, run search using searchText (New)
  if (keyword) {
    return fetchTextSearchPlaces(lat, lng, radiusMeters, keyword, apiKey);
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes: [type],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: Math.min(radiusMeters, 50000) // Places API (New) max radius constraint
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.photos'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json() as any;
    if (res.status === 200 && data.places) {
      return data.places;
    }
    if (data.error) {
      console.error(`Google searchNearby (New) error: ${data.error.message || ''}`);
    }
    return [];
  } catch (err) {
    console.error('Fetch failed for nearby search (New)', err);
    return [];
  }
}

// Text Search for Rent/Stations (New)
async function fetchTextSearchPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  query: string,
  apiKey: string
): Promise<any[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: Math.min(radiusMeters, 50000)
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.photos'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json() as any;
    if (res.status === 200 && data.places) {
      return data.places;
    }
    if (data.error) {
      console.error(`Google searchText (New) error: ${data.error.message || ''}`);
    }
    return [];
  } catch (err) {
    console.error('Fetch failed for text search (New)', err);
    return [];
  }
}

export function getMockPlaceDetails(placeId: string): Partial<Place> {
  const parts = placeId.split('-'); // ['mock', 'stay', 'goa', '2']
  const category = parts[1] || 'visit';
  const cityRaw = parts[2] || 'goa';
  const idx = Number(parts[3]) || 0;

  // Resolve matching city key
  let matchedCity = 'jaipur';
  for (const key of Object.keys(REAL_CITY_PLACES)) {
    if (cityRaw.includes(key) || key.includes(cityRaw)) {
      matchedCity = key;
      break;
    }
  }

  const cityData = REAL_CITY_PLACES[matchedCity];
  const city = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
  const centerCoords = getLocalGeocoding(city);

  let name = 'Scenic Spot';
  let address = 'Town Center Road, India';
  let rating = 4.3;
  let userRatingsTotal = 150;
  let priceLevel = 2;
  let photoRefs: string[] = [];
  let website = 'https://www.tripbuddy-india-tour.com';
  let contactNumber = `+91 98765 4321${idx}`;

  if (category === 'stay') {
    const list = [...cityData.stay.budget, ...cityData.stay['mid-range'], ...cityData.stay.luxury];
    const item = list[idx % list.length];
    name = item.name;
    address = item.address;
    rating = item.rating;
    userRatingsTotal = item.user_ratings_total;
    priceLevel = 2;
    photoRefs = getPhotosForPlaceByName(name, cityRaw, 'stay', idx);
    website = item.website || website;
    contactNumber = item.contact_number || contactNumber;
  } else if (category === 'eat') {
    const list = [...cityData.eat.street, ...cityData.eat['mid-range'], ...cityData.eat.fine];
    const item = list[idx % list.length];
    name = item.name;
    address = item.address;
    rating = item.rating;
    userRatingsTotal = item.user_ratings_total;
    photoRefs = getPhotosForPlaceByName(name, cityRaw, 'eat', idx);
    website = item.website || website;
    contactNumber = item.contact_number || contactNumber;
  } else if (category === 'visit') {
    const list = cityData.visit;
    const item = list[idx % list.length];
    const suffix = idx >= list.length ? ` (Part ${Math.floor(idx / list.length) + 1})` : '';
    name = item.name + suffix;
    address = item.address;
    rating = item.rating;
    userRatingsTotal = item.user_ratings_total;
    photoRefs = getPhotosForPlaceByName(name, cityRaw, 'visit', idx);
    website = item.website || website;
    contactNumber = item.contact_number || contactNumber;
  } else if (category === 'roam') {
    const list = cityData.roam;
    const item = list[idx % list.length];
    name = item.name;
    address = item.address;
    rating = item.rating;
    userRatingsTotal = item.user_ratings_total;
    photoRefs = getPhotosForPlaceByName(name, cityRaw, 'roam', idx);
    website = item.website || website;
    contactNumber = item.contact_number || contactNumber;
  } else if (category === 'transport') {
    const transportNames = [
      `${city} Main Bus Stand (ISBT)`, `${city} Junction Railway Station`, `Town Entry Toll Plaza Bus Halt`,
      `Local Scooter Rikshaw Terminal`, `Central Railway Crossing Stand`
    ];
    name = transportNames[idx % transportNames.length];
    address = `Highway Crossing, ${city}, India`;
    rating = Number((3.6 + (idx % 3) * 0.2).toFixed(1));
    userRatingsTotal = 50 + idx * 120;
    priceLevel = 0;
  } else if (category === 'rental') {
    const rentalNames = [
      `Royal Scooty Rentals ${city}`, `Vasco Bike Hires & Rides`, `Highway Two Wheeler Rent Shop`,
      `Speedy Bike Rental & Gear`, `Namaste Scooty Hire Services`
    ];
    name = rentalNames[idx % rentalNames.length];
    address = `Town Market Road, ${city}, India`;
    rating = Number((4.3 + (idx % 2) * 0.2).toFixed(1));
    userRatingsTotal = 35 + idx * 25;
    priceLevel = 1;
  } else {
    const agencyNames = [
      `Bharat Travel Agency ${city}`, `Wanderlust India Tours & Travels`, `Namaste Tours & Sightseeing`,
      `Central Hill Agency & Guides`, `Explorer Travel Desk`
    ];
    name = agencyNames[idx % agencyNames.length];
    address = `Agency Row Road, ${city}, India`;
    rating = Number((4.1 + (idx % 3) * 0.2).toFixed(1));
    userRatingsTotal = 25 + idx * 15;
    priceLevel = 2;
  }

  if (photoRefs.length === 0) {
    photoRefs = getPhotosForPlaceByName(name, cityRaw, category, idx);
  }

  const weekdayText = [
    "Monday: 9:00 AM – 9:00 PM",
    "Tuesday: 9:00 AM – 9:00 PM",
    "Wednesday: 9:00 AM – 9:00 PM",
    "Thursday: 9:00 AM – 9:00 PM",
    "Friday: 9:00 AM – 9:00 PM",
    "Saturday: 9:00 AM – 10:00 PM",
    "Sunday: 10:00 AM – 8:00 PM"
  ];

  return {
    place_id: placeId,
    name,
    lat: centerCoords.lat,
    lng: centerCoords.lng,
    address,
    price_level: priceLevel,
    google_rating: rating,
    user_ratings_total: userRatingsTotal,
    photo_refs: photoRefs,
    contact_number: contactNumber,
    opening_hours: { weekday_text: weekdayText },
    website,
    reviews: []
  };
}

// Fetch single Place Details (used for Details Page or detail augmentation) (New)
export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<Partial<Place>> {
  if (placeId.startsWith('mock-')) {
    return getMockPlaceDetails(placeId);
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,types,formattedAddress,location,priceLevel,rating,userRatingCount,photos,nationalPhoneNumber,regularOpeningHours,websiteUri,reviews'
      }
    });
    const data = await res.json() as any;
    
    if (res.status === 200 && data) {
      const nameText = data.displayName?.text || '';
      
      // Always use search-photo fallback because Google media endpoint returns 403 due to billing restrictions
      const photoRefs = [
        `search-photo:${encodeURIComponent(nameText)}:0`,
        `search-photo:${encodeURIComponent(nameText)}:1`,
        `search-photo:${encodeURIComponent(nameText)}:2`
      ];
      
      // Parse price level enum
      let priceLevelNum = 2;
      if (data.priceLevel) {
        const mapping: Record<string, number> = {
          'PRICE_LEVEL_FREE': 0,
          'PRICE_LEVEL_INEXPENSIVE': 1,
          'PRICE_LEVEL_MODERATE': 2,
          'PRICE_LEVEL_EXPENSIVE': 3,
          'PRICE_LEVEL_VERY_EXPENSIVE': 4
        };
        priceLevelNum = mapping[data.priceLevel] ?? (typeof data.priceLevel === 'number' ? data.priceLevel : 2);
      }

      const reviews = data.reviews || [];

      return {
        place_id: placeId,
        name: nameText,
        lat: data.location?.latitude,
        lng: data.location?.longitude,
        address: data.formattedAddress,
        price_level: priceLevelNum,
        google_rating: data.rating,
        user_ratings_total: data.userRatingCount,
        photo_refs: photoRefs,
        contact_number: data.nationalPhoneNumber,
        opening_hours: data.regularOpeningHours,
        website: data.websiteUri,
        reviews: reviews
      };
    }
    
    console.warn(`Google Place Details (New) returned non-200 status ${res.status} for ${placeId}. Falling back to mock details.`);
    return getMockPlaceDetails(placeId);
  } catch (err) {
    console.warn(`Google Place Details (New) failed for ${placeId} due to network error. Falling back to mock details.`, err);
    return getMockPlaceDetails(placeId);
  }
}

// Score a single place based on weighted criteria
// score = (0.35 * normalized_rating) + (0.20 * normalized_popularity) + (0.20 * proximity_score) + (0.15 * budget_match_score) + (0.10 * preference_match_score)
function scorePlace(
  place: any,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  category: string,
  prefs: TripPreferences
): { score: number; distance: number } {
  const lat = place.location?.latitude ?? place.geometry?.location?.lat ?? centerLat;
  const lng = place.location?.longitude ?? place.geometry?.location?.lng ?? centerLng;
  const distance = calculateDistance(centerLat, centerLng, lat, lng);
  
  // 1. Rating Score (0.35 weight)
  const rating = place.rating ?? 3.5; // Default to 3.5 if no rating
  const ratingScore = rating / 5.0;
  
  // 2. Popularity Score (0.20 weight) - log-scaled, capped at 5000 reviews
  const reviews = place.userRatingCount ?? place.user_ratings_total ?? 10;
  const popularityScore = Math.min(Math.log10(reviews + 1) / Math.log10(5001), 1.0);
  
  // 3. Proximity Score (0.20 weight) - closer is better
  const proximityScore = Math.max(0, 1.0 - (distance / radiusKm));
  
  // 4. Budget Match Score (0.15 weight)
  let budgetScore = 0.7; // default if not specified
  const priceRaw = place.priceLevel ?? place.price_level;
  let price: number | undefined = undefined;
  if (priceRaw !== undefined) {
    if (typeof priceRaw === 'number') {
      price = priceRaw;
    } else {
      const mapping: Record<string, number> = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 1,
        'PRICE_LEVEL_MODERATE': 2,
        'PRICE_LEVEL_EXPENSIVE': 3,
        'PRICE_LEVEL_VERY_EXPENSIVE': 4
      };
      price = mapping[priceRaw] ?? 2;
    }
  }
  
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
  
  // 5. Preference Match Score (0.10 weight)
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
  if (matchFound) {
    prefScore = 1.0;
  }
  
  // Weight formula
  const score = (0.35 * ratingScore) + 
                (0.20 * popularityScore) + 
                (0.20 * proximityScore) + 
                (0.15 * budgetScore) + 
                (0.10 * prefScore);
                
  return { score: Number(score.toFixed(4)), distance: Number(distance.toFixed(2)) };
}

// Geographical K-Means Clustering for Day-wise Itinerary
export function clusterPlaces(places: Place[], k: number): Place[] {
  if (places.length === 0) return [];
  if (k <= 1 || places.length <= k) {
    // Return with simple assignment
    return places.map((p, idx) => ({
      ...p,
      day_number: Math.min(idx + 1, k)
    }));
  }

  // 1. Initialize Centroids (pick k random distinct points)
  let centroids = places
    .slice(0, k)
    .map(p => ({ lat: p.lat, lng: p.lng }));

  // If we don't have enough distinct centroids, generate random variations
  while (centroids.length < k) {
    centroids.push({
      lat: places[0].lat + (Math.random() - 0.5) * 0.01,
      lng: places[0].lng + (Math.random() - 0.5) * 0.01
    });
  }

  const maxIterations = 10;
  let assignments = new Array(places.length).fill(0);
  let centroidsChanged = true;
  let iter = 0;

  while (centroidsChanged && iter < maxIterations) {
    centroidsChanged = false;
    iter++;
    
    // Step A: Assign each place to nearest centroid
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

    // Check if assignments changed
    if (newAssignments.some((val, idx) => val !== assignments[idx])) {
      assignments = newAssignments;
      centroidsChanged = true;
    }

    // Step B: Recompute Centroids
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
      return c; // Keep same if cluster is empty
    });
  }

  // Assign Day Number based on cluster (1-indexed)
  // To make it look nice, sort clusters by their average distance from center or simply by index
  return places.map((p, idx) => ({
    ...p,
    day_number: assignments[idx] + 1
  }));
}

// Generate recommendations from search parameters
export async function generateRecommendations(
  prefs: TripPreferences,
  apiKey: string
): Promise<{
  center: { lat: number; lng: number; formatted_address: string };
  stays: Place[];
  eats: Place[];
  visits: Place[];
  roams: Place[];
  transports: Place[];
  rentals: Place[];
  agencies: Place[];
}> {
  // 1. Geocode
  const center = await geocodeDestination(prefs.destination, apiKey);
  const radiusMeters = prefs.radius * 1000;
  
  // 2. Fetch all candidates concurrently
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
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'lodging', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'restaurant', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'cafe', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'tourist_attraction', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'museum', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'park', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'place_of_worship', null, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'bus_station', null, apiKey),
    fetchTextSearchPlaces(center.lat, center.lng, radiusMeters, `railway station near ${prefs.destination}`, apiKey),
    fetchTextSearchPlaces(center.lat, center.lng, radiusMeters, `bike scooty rental near ${prefs.destination}`, apiKey),
    fetchNearbyPlaces(center.lat, center.lng, radiusMeters, 'travel_agency', null, apiKey)
  ]);

  // Helper map to transform Google Place result to our model
  const mapToPlace = (p: any, category: string, subType: string): Place => {
    const scoreAndDist = scorePlace(p, center.lat, center.lng, prefs.radius, category, prefs);
    const nameText = p.displayName?.text || p.name || '';
    
    // Always use search-photo fallback because Google media endpoint returns 403 due to billing restrictions
    const photoRefs = [
      `search-photo:${encodeURIComponent(nameText)}:0`,
      `search-photo:${encodeURIComponent(nameText)}:1`,
      `search-photo:${encodeURIComponent(nameText)}:2`
    ];

    // Parse price level enum
    let priceLevelNum = p.priceLevel ?? p.price_level;
    if (priceLevelNum !== undefined && typeof priceLevelNum !== 'number') {
      const mapping: Record<string, number> = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 1,
        'PRICE_LEVEL_MODERATE': 2,
        'PRICE_LEVEL_EXPENSIVE': 3,
        'PRICE_LEVEL_VERY_EXPENSIVE': 4
      };
      priceLevelNum = mapping[priceLevelNum] ?? 2;
    }

    return {
      place_id: p.id || p.place_id,
      name: nameText,
      type: subType,
      lat: p.location?.latitude || p.geometry?.location?.lat || center.lat,
      lng: p.location?.longitude || p.geometry?.location?.lng || center.lng,
      address: p.formattedAddress || p.vicinity || p.formatted_address || '',
      price_level: priceLevelNum,
      google_rating: p.rating || p.google_rating,
      user_ratings_total: p.userRatingCount || p.user_ratings_total,
      photo_refs: photoRefs,
      distance_from_center: scoreAndDist.distance,
      score: scoreAndDist.score
    };
  };

  // 3. Process, Score and Rank each category

  // Stays (Lodging) - Target top 8
  const stays = lodgingRaw
    .map(p => mapToPlace(p, 'stay', 'stay'))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 8);

  // If no stays were found, it means the API requests failed or were denied.
  // We trigger the mock fallback recommendations generator so the app still works!
  if (stays.length === 0) {
    console.warn(`No Google places found for lodging. Falling back to local mock recommendations generator.`);
    return generateMockRecommendations(center, prefs);
  }

  // Eats (Restaurants/Cafes) - Target top 10
  const eatsRawCombined = [...restaurantRaw, ...cafeRaw];
  const uniqueEats = Array.from(new Map(eatsRawCombined.map(item => [item.id || item.place_id || (item.displayName?.text || item.name || ''), item])).values());
  const eats = uniqueEats
    .map(p => mapToPlace(p, 'eat', 'eat'))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  // Visits (Sightseeing/Attractions/Museums/Temples) - Target top 12
  const visitRawCombined = [...attractionRaw, ...museumRaw, ...worshipRaw];
  const uniqueVisits = Array.from(new Map(visitRawCombined.map(item => [item.id || item.place_id || (item.displayName?.text || item.name || ''), item])).values());
  const visits = uniqueVisits
    .map(p => mapToPlace(p, 'visit', 'visit'))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 12);

  // Roam (Parks, viewpoints, markets, local things) - Target top 6
  // We filter out any place already categorized as "visit"
  const visitIds = new Set(visits.map(v => v.place_id));
  const roams = parkRaw
    .filter(p => !visitIds.has(p.id || p.place_id))
    .map(p => mapToPlace(p, 'roam', 'roam'))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 6);

  // Transports (Bus and Train stations) - Target top 5
  const transportRawCombined = [...busRaw, ...trainRaw];
  const uniqueTransports = Array.from(new Map(transportRawCombined.map(item => [item.id || item.place_id || (item.displayName?.text || item.name || ''), item])).values());
  const transports = uniqueTransports
    .map(p => {
      const typeStr = p.types && p.types.includes('train_station') ? 'train' : 'bus';
      return mapToPlace(p, 'transport', typeStr);
    })
    .sort((a, b) => a.distance_from_center! - b.distance_from_center!) // sort by distance
    .slice(0, 5);

  // Rentals (Bike/scooty rentals) - Target top 5
  const rentals = rentalRaw
    .map(p => mapToPlace(p, 'rental', 'rental'))
    .sort((a, b) => a.distance_from_center! - b.distance_from_center!)
    .slice(0, 5);

  // Travel Agencies - Target top 5
  const agencies = agencyRaw
    .map(p => mapToPlace(p, 'agency', 'agency'))
    .sort((a, b) => a.distance_from_center! - b.distance_from_center!)
    .slice(0, 5);

  // 4. Cluster Visits & Roams for Day-wise Itinerary
  const itineraryPlaces = [...visits, ...roams];
  const clusteredItinerary = clusterPlaces(itineraryPlaces, prefs.days);

  // Separate them back if we want or return them with day numbers
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

// Generate high-quality mock recommendations customized to the city
export function generateMockRecommendations(
  center: { lat: number; lng: number; formatted_address: string },
  prefs: TripPreferences
): any {
  const cityInput = prefs.destination.split(',')[0].trim().toLowerCase();
  
  // Find matching city in our real places database
  let matchedCity = 'jaipur';
  for (const key of Object.keys(REAL_CITY_PLACES)) {
    if (cityInput.includes(key) || key.includes(cityInput)) {
      matchedCity = key;
      break;
    }
  }

  const cityData = REAL_CITY_PLACES[matchedCity];
  const city = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);

  // Helper to generate coordinates slightly offset from center
  const offsetCoord = (idx: number) => {
    const angle = (idx * 2 * Math.PI) / 10;
    const distance = 0.005 + (idx * 0.002);
    return {
      lat: center.lat + Math.sin(angle) * distance,
      lng: center.lng + Math.cos(angle) * distance
    };
  };

  // Generate Stays
  const stays: Place[] = [];
  const mockStaysData = cityData.stay[prefs.stayBudgetCategory] || cityData.stay['mid-range'];
  
  const limitStays = Math.min(8, mockStaysData.length);
  for (let i = 0; i < limitStays; i++) {
    const coords = offsetCoord(i);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    const placeData = mockStaysData[i];
    stays.push({
      place_id: `mock-stay-${matchedCity}-${i}`,
      name: placeData.name,
      type: 'stay',
      lat: coords.lat,
      lng: coords.lng,
      address: placeData.address || `${10 + i}, Hotel Row Street, ${city}, India`,
      price_level: prefs.stayBudgetCategory === 'budget' ? 1 : prefs.stayBudgetCategory === 'luxury' ? 4 : 2,
      google_rating: placeData.rating,
      user_ratings_total: placeData.user_ratings_total,
      photo_refs: getPhotosForPlaceByName(placeData.name, matchedCity, 'stay', i),
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.95 - (i * 0.03)).toFixed(4))
    });
  }

  // Generate Eats
  const eats: Place[] = [];
  const mockEatsData = cityData.eat[prefs.foodBudgetCategory] || cityData.eat['mid-range'];
  
  const limitEats = Math.min(10, mockEatsData.length);
  for (let i = 0; i < limitEats; i++) {
    const coords = offsetCoord(i + 8);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    const placeData = mockEatsData[i];
    eats.push({
      place_id: `mock-eat-${matchedCity}-${i}`,
      name: placeData.name,
      type: 'eat',
      lat: coords.lat,
      lng: coords.lng,
      address: placeData.address || `${24 + i}, Food Junction, ${city}, India`,
      price_level: prefs.foodBudgetCategory === 'street' ? 1 : prefs.foodBudgetCategory === 'fine' ? 4 : 2,
      google_rating: placeData.rating,
      user_ratings_total: placeData.user_ratings_total,
      photo_refs: getPhotosForPlaceByName(placeData.name, matchedCity, 'eat', i),
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.94 - (i * 0.03)).toFixed(4))
    });
  }

  // Generate Visits
  const visits: Place[] = [];
  const mockVisitsData = cityData.visit;
  
  const limitVisits = Math.min(12, mockVisitsData.length);
  for (let i = 0; i < limitVisits; i++) {
    const coords = offsetCoord(i + 18);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    const placeData = mockVisitsData[i];
    
    visits.push({
      place_id: `mock-visit-${matchedCity}-${i}`,
      name: placeData.name,
      type: 'visit',
      lat: coords.lat,
      lng: coords.lng,
      address: placeData.address || `${city} Sightseeing Zone, India`,
      price_level: 1,
      google_rating: placeData.rating,
      user_ratings_total: placeData.user_ratings_total,
      photo_refs: getPhotosForPlaceByName(placeData.name, matchedCity, 'visit', i),
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.96 - (i * 0.03)).toFixed(4))
    });
  }

  // Generate Roams
  const roams: Place[] = [];
  const mockRoamsData = cityData.roam;
  
  const limitRoams = Math.min(6, mockRoamsData.length);
  for (let i = 0; i < limitRoams; i++) {
    const coords = offsetCoord(i + 30);
    const dist = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    const placeData = mockRoamsData[i];
    roams.push({
      place_id: `mock-roam-${matchedCity}-${i}`,
      name: placeData.name,
      type: 'roam',
      lat: coords.lat,
      lng: coords.lng,
      address: placeData.address || `${city} Local Roaming Zone, India`,
      price_level: 0,
      google_rating: placeData.rating,
      user_ratings_total: placeData.user_ratings_total,
      photo_refs: getPhotosForPlaceByName(placeData.name, matchedCity, 'roam', i),
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.92 - (i * 0.03)).toFixed(4))
    });
  }

  // Generate Transports
  const transports: Place[] = [];
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
    const tName = transportNames[i % transportNames.length];
    transports.push({
      place_id: `mock-transport-${matchedCity}-${i}`,
      name: tName,
      type: i === 1 || i === 4 ? 'train' : 'bus',
      lat: coords.lat,
      lng: coords.lng,
      address: `Highway Crossing, ${city}, India`,
      google_rating: Number((3.6 + (i % 4) * 0.2).toFixed(1)),
      user_ratings_total: 50 + i * 200,
      photo_refs: getPhotosForPlaceByName(tName, matchedCity, 'transport', i),
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.88 - (i * 0.03)).toFixed(4))
    });
  }

  // Generate Rentals
  const rentals: Place[] = [];
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
    const rName = rentalNames[i % rentalNames.length];
    rentals.push({
      place_id: `mock-rental-${matchedCity}-${i}`,
      name: rName,
      type: 'rental',
      lat: coords.lat,
      lng: coords.lng,
      address: `Town Market Road, ${city}, India`,
      google_rating: Number((4.3 + (i % 3) * 0.2).toFixed(1)),
      user_ratings_total: 35 + i * 25,
      photo_refs: getPhotosForPlaceByName(rName, matchedCity, 'rental', i),
      contact_number: `+91 98765 4321${i}`,
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.90 - (i * 0.02)).toFixed(4))
    });
  }

  // Generate Agencies
  const agencies: Place[] = [];
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
    const aName = agencyNames[i % agencyNames.length];
    agencies.push({
      place_id: `mock-agency-${matchedCity}-${i}`,
      name: aName,
      type: 'agency',
      lat: coords.lat,
      lng: coords.lng,
      address: `Agency Row Road, ${city}, India`,
      google_rating: Number((4.1 + (i % 4) * 0.2).toFixed(1)),
      user_ratings_total: 25 + i * 15,
      photo_refs: getPhotosForPlaceByName(aName, matchedCity, 'agency', i),
      contact_number: `+91 99999 8888${i}`,
      distance_from_center: Number(dist.toFixed(2)),
      score: Number((0.92 - (i * 0.02)).toFixed(4))
    });
  }

  // Cluster Visits and Roams into Day wise
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

export function resolvePlacePhotos(name: string): string[] | null {
  const lowercaseName = name.toLowerCase();

  // Udaipur Stays & Landmarks
  if (lowercaseName.includes('taj lake palace')) {
    return [
      "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('oberoi udaivilas')) {
    return [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('leela palace udaipur') || lowercaseName.includes('leela palace')) {
    return [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('city palace') && lowercaseName.includes('udaipur')) {
    return [
      "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('lake pichola') || lowercaseName.includes('pichola boat cruise')) {
    return [
      "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('jag mandir')) {
    return [
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598977123418-45f04b615ae9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('sajjangarh') || lowercaseName.includes('monsoon palace')) {
    return [
      "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603258591834-3112a2ef45b7?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('saheliyon-ki-bari')) {
    return [
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('jagdish temple')) {
    return [
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608958415714-3a5578762744?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Goa Stays & Landmarks
  if (lowercaseName.includes('bom jesus')) {
    return [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('fort aguada') || lowercaseName.includes('aguada lighthouse')) {
    return [
      "https://images.unsplash.com/photo-1587922449581-7c5519233a7a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('dudhsagar')) {
    return [
      "https://images.unsplash.com/photo-1614082242765-7c99cd00352e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('chapora fort') || lowercaseName.includes('chapora')) {
    return [
      "https://images.unsplash.com/photo-1587922449581-7c5519233a7a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('baga beach') || lowercaseName.includes('baga water sports')) {
    return [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('fontainhas') || lowercaseName.includes('latin quarter')) {
    return [
      "https://images.unsplash.com/photo-1607622487441-267be8eb44f6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Jaipur Stays & Landmarks
  if (lowercaseName.includes('hawa mahal')) {
    return [
      "https://images.unsplash.com/photo-1603260391630-902b6a89afb9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('amer fort') || lowercaseName.includes('amber palace') || lowercaseName.includes('amber fort')) {
    return [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603260391630-902b6a89afb9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('city palace') && lowercaseName.includes('jaipur')) {
    return [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603260391630-902b6a89afb9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('jal mahal')) {
    return [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603260391630-902b6a89afb9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('nahargarh')) {
    return [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Rishikesh Landmarks
  if (lowercaseName.includes('lakshman jhula') || lowercaseName.includes('laxman jhula') || lowercaseName.includes('ram jhula')) {
    return [
      "https://images.unsplash.com/photo-1590050752117-238cb0612b1b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('triveni ghat')) {
    return [
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590050752117-238cb0612b1b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('beatles ashram')) {
    return [
      "https://images.unsplash.com/photo-1545231027-63b3f1e997f5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Delhi Landmarks
  if (lowercaseName.includes('qutub minar')) {
    return [
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595841696660-1e90ef831908?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('red fort')) {
    return [
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('india gate')) {
    return [
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595841696660-1e90ef831908?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('lotus temple')) {
    return [
      "https://images.unsplash.com/photo-1595841696660-1e90ef831908?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Mumbai Landmarks
  if (lowercaseName.includes('gateway of india')) {
    return [
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ];
  }
  if (lowercaseName.includes('marine drive')) {
    return [
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Munnar Tea Gardens
  if (lowercaseName.includes('eravikulam') || lowercaseName.includes('tea garden') || lowercaseName.includes('mattupetty') || lowercaseName.includes('anamudi') || lowercaseName.includes('kolukkumalai')) {
    return [
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Manali Snow Mountains
  if (lowercaseName.includes('solang') || lowercaseName.includes('rohtang') || lowercaseName.includes('jogini') || lowercaseName.includes('hadimba')) {
    return [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Pondicherry White Town
  if (lowercaseName.includes('paradise beach') || lowercaseName.includes('auroville') || lowercaseName.includes('french quarter') || lowercaseName.includes('rock beach')) {
    return [
      "https://images.unsplash.com/photo-1607622487441-267be8eb44f6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80"
    ];
  }

  // Bengaluru Lalbagh
  if (lowercaseName.includes('lalbagh') || lowercaseName.includes('glass house') || lowercaseName.includes('cubbon') || lowercaseName.includes('bangalore palace')) {
    return [
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
    ];
  }

  return null;
}

export function getPhotosForPlaceByName(name: string, _city: string, _category: string, _idx: number): string[] {
  const encName = encodeURIComponent(name);
  return [
    `search-photo:${encName}:0`,
    `search-photo:${encName}:1`,
    `search-photo:${encName}:2`
  ];
}

// Retrieve a set of 3 related mock photos for a destination city and category
export function getPhotosForPlace(city: string, category: string, idx: number): string[] {
  const normCity = city.toLowerCase();
  let matchedCity = 'jaipur';
  for (const key of Object.keys(REAL_CITY_PLACES)) {
    if (normCity.includes(key) || key.includes(normCity)) {
      matchedCity = key;
      break;
    }
  }

  const cityData = REAL_CITY_PLACES[matchedCity];
  let primaryPhotos: string[] = [];

  if (category === 'stay') {
    const list = [...cityData.stay.budget, ...cityData.stay['mid-range'], ...cityData.stay.luxury];
    const item = list[idx % list.length];
    primaryPhotos = [...item.photo_refs];
  } else if (category === 'eat') {
    const list = [...cityData.eat.street, ...cityData.eat['mid-range'], ...cityData.eat.fine];
    const item = list[idx % list.length];
    primaryPhotos = [...item.photo_refs];
  } else {
    const list = category === 'roam' ? cityData.roam : cityData.visit;
    const item = list[idx % list.length];
    primaryPhotos = [...item.photo_refs];
  }

  // Pad to at least 3 photos using general photos from this city and category
  if (primaryPhotos.length < 3) {
    const allCityPhotos: string[] = [];
    const sourceList = category === 'stay' 
      ? [...cityData.stay.budget, ...cityData.stay['mid-range'], ...cityData.stay.luxury]
      : category === 'eat'
        ? [...cityData.eat.street, ...cityData.eat['mid-range'], ...cityData.eat.fine]
        : [...cityData.visit, ...cityData.roam];
    
    sourceList.forEach(item => {
      item.photo_refs.forEach(p => {
        if (!primaryPhotos.includes(p) && !allCityPhotos.includes(p)) {
          allCityPhotos.push(p);
        }
      });
    });

    // If still not enough, add from the other list
    if (primaryPhotos.length + allCityPhotos.length < 3) {
      const backupList = category === 'stay' || category === 'eat'
        ? [...cityData.visit, ...cityData.roam]
        : [...cityData.stay.budget, ...cityData.stay['mid-range'], ...cityData.stay.luxury];
      
      backupList.forEach(item => {
        item.photo_refs.forEach(p => {
          if (!primaryPhotos.includes(p) && !allCityPhotos.includes(p)) {
            allCityPhotos.push(p);
          }
        });
      });
    }

    // Push until we have at least 3 photos
    let backupIdx = 0;
    while (primaryPhotos.length < 3 && allCityPhotos.length > 0) {
      primaryPhotos.push(allCityPhotos[backupIdx % allCityPhotos.length]);
      backupIdx++;
    }
  }

  return primaryPhotos;
}

// Cache for scraped images: Map<placeName, imageUrl[]>
const scrapedImagesCache = new Map<string, string[]>();

export async function resolveScrapedImageUrls(name: string): Promise<string[]> {
  const cacheKey = name.trim().toLowerCase();
  if (scrapedImagesCache.has(cacheKey)) {
    return scrapedImagesCache.get(cacheKey) || [];
  }

  try {
    const query = name.trim();
    const mainUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const mainRes = await fetch(mainUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    if (mainRes.status !== 200) return [];
    const mainHtml = await mainRes.text();
    
    const vqdRegex = /vqd=["']([^"']+)["']/i;
    const match = mainHtml.match(vqdRegex);
    if (!match) return [];
    const vqd = match[1];

    const imageUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://duckduckgo.com/'
      }
    });
    if (imgRes.status !== 200) return [];
    const data = await imgRes.json() as any;
    
    if (data.results && data.results.length > 0) {
      const urls = data.results.map((r: any) => r.image).filter(Boolean);
      if (urls.length > 0) {
        scrapedImagesCache.set(cacheKey, urls);
        return urls;
      }
    }
  } catch (err) {
    console.error(`Error scraping image URLs for ${name}:`, err);
  }
  return [];
}
