import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured, fallbackDb } from '../supabaseClient'
import { AuthModal } from '../components/AuthModal'
import { 
  Calendar, 
  MapPin, 
  Trash2, 
  Compass, 
  ChevronRight,
  Wallet,
  Map
} from 'lucide-react'

interface SavedTrip {
  id: string;
  destination: string;
  days: number;
  radius: number;
  budget: {
    type: string;
    value: number;
    stay_category: string;
    food_category: string;
  };
  preferences: string[];
  group_type: string;
  travel_mode: string;
  created_at: string;
  recommendations?: any; // loaded details snapshot
  expenses?: any;
  notes?: string;
}

export const MyTrips: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setIsAuthOpen(true)
      return
    }

    const loadTrips = async () => {
      setLoading(true)
      try {
        if (isSupabaseConfigured() && supabase) {
          // Get saved trips for logged-in user
          const { data: tripsData, error: tripsError } = await supabase
            .from('trips')
            .select(`
              id,
              destination,
              lat,
              lng,
              radius,
              days,
              budget,
              preferences,
              group_type,
              travel_mode,
              expenses,
              notes,
              created_at
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (tripsError) throw tripsError

          // For each trip, we load recommendations snapshot to allow reloading results page
          const formattedTrips: SavedTrip[] = []
          
          if (tripsData) {
            for (const t of tripsData) {
              const { data: recs } = await supabase
                .from('trip_recommendations')
                .select(`
                  category,
                  score,
                  day_number,
                  places(*)
                `)
                .eq('trip_id', t.id)

              // Formulate recommendation snapshot structures matching generateRecommendations
              const snapshot: any = {
                center: { lat: t.lat, lng: t.lng, formatted_address: t.destination },
                stays: [],
                eats: [],
                visits: [],
                roams: [],
                transports: [],
                rentals: [],
                agencies: []
              }

              if (recs) {
                recs.forEach((r: any) => {
                  const place = {
                    place_id: r.places.place_id,
                    name: r.places.name,
                    type: r.places.type,
                    lat: r.places.lat,
                    lng: r.places.lng,
                    address: r.places.address,
                    price_level: r.places.price_level,
                    google_rating: r.places.google_rating,
                    user_ratings_total: r.places.user_ratings_total,
                    photo_refs: r.places.photo_refs,
                    contact_number: r.places.contact_number,
                    website: r.places.website,
                    score: Number(r.score),
                    day_number: r.day_number
                  }

                  if (r.category === 'stay') snapshot.stays.push(place)
                  else if (r.category === 'eat') snapshot.eats.push(place)
                  else if (r.category === 'visit') snapshot.visits.push(place)
                  else if (r.category === 'roam') snapshot.roams.push(place)
                  else if (r.category === 'transport') snapshot.transports.push(place)
                  else if (r.category === 'rental') snapshot.rentals.push(place)
                  else if (r.category === 'agency') snapshot.agencies.push(place)
                })
              }

              formattedTrips.push({
                id: t.id,
                destination: t.destination,
                days: t.days,
                radius: Number(t.radius),
                budget: t.budget,
                preferences: t.preferences,
                group_type: t.group_type,
                travel_mode: t.travel_mode,
                created_at: t.created_at,
                recommendations: snapshot,
                expenses: t.expenses || [],
                notes: t.notes || ''
              })
            }
          }
          setTrips(formattedTrips)

        } else {
          // local storage mock fallback load
          const mockTrips = fallbackDb.getTrips()
          setTrips(mockTrips)
        }
      } catch (err: any) {
        console.error(err)
        alert(`Failed to load trips: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadTrips()
  }, [user])

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation() // Prevent loading card trigger
    if (!window.confirm('Delete this saved trip?')) return

    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('trips')
          .delete()
          .eq('id', tripId)
        
        if (error) throw error
      } else {
        fallbackDb.deleteTrip(tripId)
      }

      setTrips(prev => prev.filter(t => t.id !== tripId))
      alert('Trip deleted.')
    } catch (err: any) {
      console.error(err)
      alert(`Deletion failed: ${err.message}`)
    }
  }

  // Load a saved trip back to results page
  const handleLoadTrip = (trip: SavedTrip) => {
    const tripPrefs = {
      destination: trip.destination,
      days: trip.days,
      radius: trip.radius,
      budgetType: trip.budget.type,
      budgetValue: trip.budget.value,
      stayBudgetCategory: trip.budget.stay_category,
      foodBudgetCategory: trip.budget.food_category,
      preferences: trip.preferences,
      groupType: trip.group_type,
      travelMode: trip.travel_mode,
      notes: trip.notes || ''
    }

    localStorage.setItem('active_trip_inputs', JSON.stringify(tripPrefs))
    localStorage.setItem('active_trip_results', JSON.stringify(trip.recommendations))
    localStorage.setItem('active_trip_id', trip.id)
    localStorage.setItem('active_trip_expenses', JSON.stringify(trip.expenses || []))
    localStorage.removeItem('active_trip_tab')
    
    navigate('/results')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-travel-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-travel-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-forest-750">Retrieving saved trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-travel-50 min-h-screen text-left py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        <div className="border-b border-travel-200 pb-5 space-y-1.5">
          <h1 className="text-3xl font-extrabold font-serif text-forest-950">My Saved Trips</h1>
          <p className="text-xs font-semibold text-forest-600">All your custom curations in one place.</p>
        </div>

        {!user ? (
          <div className="bg-white border border-travel-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
            <MapPin className="w-12 h-12 text-travel-400 mx-auto animate-bounce" />
            <h3 className="font-serif font-black text-xl text-forest-950">Sign in to view saved trips</h3>
            <p className="text-sm text-forest-600 max-w-sm mx-auto">
              Guests can generate itineraries, but must log in to securely save and retrieve them later.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white border border-travel-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <Compass className="w-12 h-12 text-travel-400 mx-auto animate-spin-slow" />
            <h3 className="font-serif font-black text-xl text-forest-950">No saved trips yet</h3>
            <p className="text-sm text-forest-600 max-w-sm mx-auto">
              Start planning your custom adventure in India and click "Save This Trip" on the results page.
            </p>
            <button
              onClick={() => navigate('/plan')}
              className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleLoadTrip(trip)}
                className="bg-white rounded-3xl border border-travel-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Visual Header / Map simulation */}
                <div className="h-32 bg-travel-100/50 border-b border-travel-50 relative p-6 flex flex-col justify-end text-left">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=500&q=80')" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
                  
                  <div className="relative z-10 text-white space-y-1">
                    <h3 className="font-serif font-bold text-lg leading-tight line-clamp-1">{trip.destination}</h3>
                    <p className="text-[10px] text-travel-100 font-semibold">{new Date(trip.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Details list info */}
                <div className="p-6 text-left flex-1 flex flex-col justify-between space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-forest-750">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-travel-500" />
                      <span>{trip.days} Days Stay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={14} className="text-travel-500" />
                      <span>{trip.radius} km radius</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Wallet size={14} className="text-travel-500 animate-pulse" />
                      <span>₹{trip.budget.value} Budget ({trip.budget.type === 'total' ? 'Total' : 'Per-Day'})</span>
                    </div>
                  </div>

                  {/* Badges and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-travel-50 text-[10px] font-bold">
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                    
                    <span className="text-travel-500 group-hover:translate-x-1.5 transition-transform flex items-center gap-0.5">
                      <span>Load Itinerary</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  )
}
