import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if keys are custom/valid and not default placeholders
const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key'

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

export const isSupabaseConfigured = () => !!supabase

// Helper to get mock user data from localStorage for fallback mode
export const getMockUser = () => {
  const u = localStorage.getItem('trip_buddy_mock_user')
  return u ? JSON.parse(u) : null
}

export const setMockUser = (user: any) => {
  if (user) {
    localStorage.setItem('trip_buddy_mock_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('trip_buddy_mock_user')
  }
  // Dispatch event for UI updates
  window.dispatchEvent(new Event('mock-auth-change'))
}

// Fallback database helpers (localStorage)
export const fallbackDb = {
  getTrips: () => {
    const t = localStorage.getItem('trip_buddy_mock_trips')
    return t ? JSON.parse(t) : []
  },
  saveTrip: (trip: any, recommendations: any) => {
    const trips = fallbackDb.getTrips()
    const newTrip = {
      ...trip,
      id: trip.id || `mock-trip-${Date.now()}`,
      created_at: trip.created_at || new Date().toISOString(),
      recommendations // snapshot
    }
    trips.unshift(newTrip)
    localStorage.setItem('trip_buddy_mock_trips', JSON.stringify(trips))
    return newTrip
  },
  deleteTrip: (tripId: string) => {
    const trips = fallbackDb.getTrips()
    const filtered = trips.filter((t: any) => t.id !== tripId)
    localStorage.setItem('trip_buddy_mock_trips', JSON.stringify(filtered))
  },
  getFeedback: (placeId: string) => {
    const f = localStorage.getItem(`trip_buddy_mock_feedback_${placeId}`)
    return f ? JSON.parse(f) : []
  },
  saveFeedback: (placeId: string, review: any) => {
    const feedback = fallbackDb.getFeedback(placeId)
    const newReview = {
      ...review,
      id: `mock-review-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    feedback.unshift(newReview)
    localStorage.setItem(`trip_buddy_mock_feedback_${placeId}`, JSON.stringify(feedback))
    return newReview
  }
}
