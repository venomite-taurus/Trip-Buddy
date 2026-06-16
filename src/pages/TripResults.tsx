import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured, fallbackDb } from '../supabaseClient'
import { InteractiveMap } from '../components/InteractiveMap'
import { AuthModal } from '../components/AuthModal'
import { 
  Calendar, 
  Hotel, 
  Utensils, 
  Camera, 
  Car, 
  ChevronRight, 
  Heart, 
  RefreshCw,
  Navigation,
  Compass,
  Wallet,
  Plus,
  Trash2,
  Coins
} from 'lucide-react'

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: 'Stay' | 'Food' | 'Transport' | 'Sightseeing' | 'Shopping' | 'Other';
}

type TabType = 'itinerary' | 'stay' | 'eat' | 'visit' | 'roam' | 'around' | 'expenses'

export const TripResults: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [inputs, setInputs] = useState<any>(null)
  const [results, setResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('active_trip_tab') as TabType
    return savedTab || 'itinerary'
  })
  
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [tripId, setTripId] = useState<string | null>(null)
  const [focusedPlace, setFocusedPlace] = useState<any | null>(null)
  
  // Reset focus and store tab in localStorage when tab changes
  useEffect(() => {
    setFocusedPlace(null)
    localStorage.setItem('active_trip_tab', activeTab)
  }, [activeTab])
  
  // Custom expense form states
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<'Stay' | 'Food' | 'Transport' | 'Sightseeing' | 'Shopping' | 'Other'>('Other')

  // Load results from storage
  useEffect(() => {
    const storedInputs = localStorage.getItem('active_trip_inputs')
    const storedResults = localStorage.getItem('active_trip_results')
    const storedTripId = localStorage.getItem('active_trip_id')
    const storedExpenses = localStorage.getItem('active_trip_expenses')

    if (!storedInputs || !storedResults) {
      navigate('/plan')
      return
    }

    setInputs(JSON.parse(storedInputs))
    setResults(JSON.parse(storedResults))

    if (storedTripId) {
      setTripId(storedTripId)
      setSaved(true)
    } else {
      setTripId(null)
      setSaved(false)
    }

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses))
    } else {
      setExpenses([])
    }
  }, [navigate])

  if (!inputs || !results) {
    return (
      <div className="min-h-screen bg-travel-50 flex items-center justify-center">
        <LoaderComponent />
      </div>
    )
  }

  const { center, stays, eats, visits, roams, transports, rentals, agencies } = results

  // Map markers compiler
  const compileMarkers = (): any[] => {
    const list: any[] = []
    
    // Add stays
    stays.forEach((s: any) => list.push({ ...s, category: 'stay' }))
    // Add eats
    eats.forEach((e: any) => list.push({ ...e, category: 'eat' }))
    // Add visits
    visits.forEach((v: any) => list.push({ ...v, category: 'visit' }))
    // Add roams
    roams.forEach((r: any) => list.push({ ...r, category: 'roam' }))
    // Add transports
    transports.forEach((t: any) => list.push({ ...t, category: 'transport' }))
    // Add rentals
    rentals.forEach((rt: any) => list.push({ ...rt, category: 'rental' }))
    // Add agencies
    agencies.forEach((ag: any) => list.push({ ...ag, category: 'agency' }))

    return list
  }

  // Get active category for map filter based on tab
  const getMapActiveCategory = () => {
    if (activeTab === 'stay') return 'stay'
    if (activeTab === 'eat') return 'eat'
    if (activeTab === 'visit') return 'visit'
    if (activeTab === 'roam') return 'roam'
    if (activeTab === 'around') return 'rental' // focus on rentals in get around
    return 'all' // Itinerary tab shows everything
  }

  // Pan to a specific place on the map by setting focused place
  const handleViewOnMap = (place: any) => {
    setFocusedPlace(place)
  }

  const handleSaveTrip = async () => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }

    setSaving(true)
    try {
      if (isSupabaseConfigured() && supabase) {
        // 1. Save trip details to database
        const insertObj: any = {
          user_id: user.id,
          destination: inputs.destination,
          lat: center.lat,
          lng: center.lng,
          radius: inputs.radius,
          days: inputs.days,
          budget: {
            type: inputs.budgetType,
            value: inputs.budgetValue,
            stay_category: inputs.stayBudgetCategory,
            food_category: inputs.foodBudgetCategory
          },
          preferences: inputs.preferences,
          group_type: inputs.groupType,
          travel_mode: inputs.travelMode,
          expenses: expenses,
          notes: inputs.notes || ''
        }

        let { data: tripData, error: tripError } = await supabase
          .from('trips')
          .insert(insertObj)
          .select()
          .single()

        // Fallback: If database is missing the 'notes' column, retry insertion without it
        if (tripError && (tripError.message.includes('notes') || (tripError.details && tripError.details.includes('notes')))) {
          console.warn("Supabase trips table is missing the 'notes' column. Retrying insert without 'notes'.")
          delete insertObj.notes
          const retry = await supabase
            .from('trips')
            .insert(insertObj)
            .select()
            .single()
          tripData = retry.data
          tripError = retry.error
        }

        if (tripError) throw tripError

        // 2. Save place items cache in database
        const allPlaces = [...stays, ...eats, ...visits, ...roams, ...transports, ...rentals, ...agencies]
        
        for (const p of allPlaces) {
          // Check if place already exists
          const { data: existing } = await supabase
            .from('places')
            .select('place_id')
            .eq('place_id', p.place_id)
            .maybeSingle()

          if (!existing) {
            await supabase.from('places').insert({
              place_id: p.place_id,
              name: p.name,
              type: p.type,
              lat: p.lat,
              lng: p.lng,
              address: p.address,
              price_level: p.price_level,
              google_rating: p.google_rating,
              user_ratings_total: p.user_ratings_total,
              photo_refs: p.photo_refs
            })
          }
        }

        // 3. Save recommendations
        const recommendationsInserts = allPlaces.map((p: any) => {
          let category = 'visit'
          if (stays.some((s: any) => s.place_id === p.place_id)) category = 'stay'
          else if (eats.some((e: any) => e.place_id === p.place_id)) category = 'eat'
          else if (roams.some((r: any) => r.place_id === p.place_id)) category = 'roam'
          else if (transports.some((t: any) => t.place_id === p.place_id)) category = 'transport'
          else if (rentals.some((rt: any) => rt.place_id === p.place_id)) category = 'rental'
          else if (agencies.some((ag: any) => ag.place_id === p.place_id)) category = 'agency'

          return {
            trip_id: tripData.id,
            category,
            place_id: p.place_id,
            score: p.score || 0,
            day_number: p.day_number || null
          }
        })

        const { error: recError } = await supabase
          .from('trip_recommendations')
          .insert(recommendationsInserts)

        if (recError) throw recError

        setTripId(tripData.id)
        localStorage.setItem('active_trip_id', tripData.id)
      } else {
        // Local fallback save
        const savedTrip = fallbackDb.saveTrip(
          {
            destination: inputs.destination,
            lat: center.lat,
            lng: center.lng,
            radius: inputs.radius,
            days: inputs.days,
            budget: {
              type: inputs.budgetType,
              value: inputs.budgetValue,
              stay_category: inputs.stayBudgetCategory,
              food_category: inputs.foodBudgetCategory
            },
            preferences: inputs.preferences,
            group_type: inputs.groupType,
            travel_mode: inputs.travelMode,
            expenses: expenses,
            notes: inputs.notes || ''
          },
          results
        )
        setTripId(savedTrip.id)
        localStorage.setItem('active_trip_id', savedTrip.id)
      }
      setSaved(true)
      setActiveTab('expenses')
    } catch (err: any) {
      console.error(err)
      alert(`Failed to save trip: ${err.message || 'Error occurred'}`)
    } finally {
      setSaving(false)
    }
  }

  const saveExpensesData = async (newExpenses: ExpenseItem[]) => {
    setExpenses(newExpenses)
    localStorage.setItem('active_trip_expenses', JSON.stringify(newExpenses))

    if (tripId) {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase
            .from('trips')
            .update({ expenses: newExpenses })
            .eq('id', tripId)
          if (error) throw error
        } catch (err) {
          console.error('Failed to sync expenses to database:', err)
        }
      } else {
        const trips = fallbackDb.getTrips()
        const updated = trips.map((t: any) => {
          if (t.id === tripId) {
            return { ...t, expenses: newExpenses }
          }
          return t
        })
        localStorage.setItem('trip_buddy_mock_trips', JSON.stringify(updated))
      }
    }
  }

  const handleQuickAddExpense = (place: any, catType: string) => {
    let expenseCat: 'Stay' | 'Food' | 'Transport' | 'Sightseeing' | 'Shopping' | 'Other' = 'Other'
    if (catType === 'stay') expenseCat = 'Stay'
    else if (catType === 'eat') expenseCat = 'Food'
    else if (catType === 'visit' || catType === 'roam') expenseCat = 'Sightseeing'
    else if (catType === 'rental' || catType === 'transport') expenseCat = 'Transport'

    const alreadyExists = expenses.some(item => item.title.includes(place.name) || place.name.includes(item.title))
    if (alreadyExists) {
      alert(`"${place.name}" is already in your expenses!`)
      return
    }

    let estAmount = 250
    if (catType === 'stay') {
      const cat = inputs.stayBudgetCategory || 'mid-range'
      estAmount = cat === 'luxury' ? 12000 : cat === 'budget' ? 1200 : 3500
    } else if (catType === 'eat') {
      const cat = inputs.foodBudgetCategory || 'mid-range'
      estAmount = cat === 'fine' ? 2200 : cat === 'street' ? 200 : 600
    } else if (catType === 'visit') {
      estAmount = 250
    } else if (catType === 'roam') {
      estAmount = 100
    } else if (catType === 'rental') {
      estAmount = 500
    } else if (catType === 'transport') {
      estAmount = 1500
    }

    const newItem: ExpenseItem = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: place.name,
      amount: estAmount,
      category: expenseCat
    }

    const updated = [newItem, ...expenses]
    saveExpensesData(updated)
    alert(`Added "${place.name}" to expenses (Est. Cost: ₹${estAmount})`)
  }

  const handleRegenerate = async () => {
    setSaving(true)
    try {
      // Re-run search but add score randomization key on backend
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      })
      const data = await response.json()
      
      // Randomize scores slightly to rearrange top slots
      const randomizeList = (list: any[]) => {
        return list.map(item => ({
          ...item,
          score: Number(((item.score || 0) + (Math.random() - 0.5) * 0.15).toFixed(4))
        })).sort((a,b) => b.score - a.score)
      }

      const randomizedResults = {
        ...data,
        stays: randomizeList(data.stays).slice(0, 8),
        eats: randomizeList(data.eats).slice(0, 10),
        visits: randomizeList(data.visits).slice(0, 12),
        roams: randomizeList(data.roams).slice(0, 6)
      }

      localStorage.setItem('active_trip_results', JSON.stringify(randomizedResults))
      setResults(randomizedResults)
      setSaved(false)
    } catch (err) {
      console.error(err)
      alert('Failed to regenerate recommendations.')
    } finally {
      setSaving(false)
    }
  }

  // Currency helper
  const renderPriceLevel = (level?: number) => {
    if (level === undefined || level === null) return '₹'
    return '₹'.repeat(level + 1)
  }

  // Photo reference formatter
  const getPhotoUrl = (ref?: string, place?: any) => {
    if (!ref) {
      const category = place?.type || 'visit';
      const fallbacks: Record<string, string> = {
        stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
        eat: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80',
        visit: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=500&q=80',
        roam: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=500&q=80',
        transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=80',
        bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500&q=80',
        train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80',
        rental: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=500&q=80',
        agency: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=80'
      };
      return fallbacks[category] || fallbacks['visit'];
    }
    if (ref.startsWith('http://') || ref.startsWith('https://')) return ref
    const nameParam = place?.name ? `&name=${encodeURIComponent(place.name)}` : '';
    const categoryParam = place?.type ? `&category=${encodeURIComponent(place.type)}` : '';
    const cityVal = inputs?.destination ? inputs.destination.split(',')[0].trim() : '';
    const cityParam = cityVal ? `&city=${encodeURIComponent(cityVal)}` : '';
    return `/api/place-photo?ref=${ref}${nameParam}${categoryParam}${cityParam}`
  }


  return (
    <div className="bg-travel-50 min-h-screen text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Results title dashboard banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-travel-200 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 font-serif">
              Itinerary for {inputs.destination}
            </h1>
            <p className="text-sm font-semibold text-forest-600 flex items-center gap-2">
              <span>📅 {inputs.days} Days</span>
              <span>•</span>
              <span className="capitalize">💰 {inputs.stayBudgetCategory} Stay & {inputs.foodBudgetCategory} Food</span>
              <span>•</span>
              <span>📍 {inputs.radius} km radius</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRegenerate}
              disabled={saving}
              className="px-4 py-2.5 bg-white border border-travel-300 hover:bg-travel-100 font-bold rounded-xl text-xs text-forest-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleSaveTrip}
              disabled={saving || saved}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                saved 
                  ? 'bg-green-500 text-white shadow-none cursor-default' 
                  : 'bg-travel-500 hover:bg-travel-600 text-white shadow-travel-500/10 hover:shadow'
              }`}
            >
              <Heart size={14} className={saved ? 'fill-white' : ''} />
              <span>{saved ? 'Saved to My Trips' : 'Save This Trip'}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tabs & Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cards List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tabs List */}
            <div className="flex bg-white border border-travel-200 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap scrollbar-none shadow-sm">
              {[
                { id: 'itinerary', label: 'Itinerary', icon: Calendar },
                { id: 'stay', label: 'Stays', icon: Hotel },
                { id: 'eat', label: 'Eats', icon: Utensils },
                { id: 'visit', label: 'Visit', icon: Camera },
                { id: 'around', label: 'Around', icon: Car },
                { id: 'expenses', label: saved ? 'Expense Tracker' : 'Expense Tracker 🔒', icon: Wallet }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-travel-500 text-white shadow-sm shadow-travel-500/10' 
                        : 'text-forest-700 hover:bg-travel-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENTS */}
            
            {/* 1. ITINERARY TAB */}
            {activeTab === 'itinerary' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {Array.from({ length: inputs.days }, (_, i) => i + 1).map(day => {
                  const dayVisits = visits.filter((v: any) => v.day_number === day)
                  const dayRoams = roams.filter((r: any) => r.day_number === day)
                  const dayPlaces = [...dayVisits, ...dayRoams]

                  return (
                    <div key={day} className="bg-white rounded-3xl border border-travel-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-travel-100 pb-3">
                        <h3 className="font-serif font-black text-lg text-forest-950">Day {day} Itinerary</h3>
                        <span className="text-xs font-bold text-travel-500 uppercase tracking-wider">{dayPlaces.length} stops</span>
                      </div>

                      {dayPlaces.length === 0 ? (
                        <p className="text-xs text-forest-500 italic text-center py-4">No activities scheduled for today. Explore Stays or Eats!</p>
                      ) : (
                        <div className="space-y-4">
                          {dayPlaces.map((place: any, index: number) => (
                            <div key={place.place_id} className="flex gap-4 items-start relative group">
                              {/* Left track line decoration */}
                              {index < dayPlaces.length - 1 && (
                                <div className="absolute left-[15px] top-[30px] bottom-[-20px] w-[1px] bg-travel-200"></div>
                              )}
                              
                              <div className="w-8 h-8 rounded-full bg-travel-100 text-travel-700 flex items-center justify-center font-bold text-xs border border-travel-200 shrink-0 z-10">
                                {index + 1}
                              </div>

                              <div className="flex-1 bg-travel-50/50 hover:bg-travel-100/30 p-4 border border-travel-200 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start transition-colors">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <h4 className="font-bold text-sm text-forest-950 flex items-center gap-1.5">
                                    <span>{place.name}</span>
                                    <span className="px-2 py-0.5 bg-travel-100 text-travel-800 text-[9px] font-extrabold rounded-full uppercase">
                                      {place.type === 'roam' ? 'Roam' : 'Visit'}
                                    </span>
                                  </h4>
                                  <p className="text-xs text-forest-500">{place.address}</p>
                                  <div className="flex items-center gap-3 pt-1">
                                    {place.google_rating && (
                                      <span className="text-xs font-bold text-yellow-600 flex items-center gap-0.5">
                                        ★ {place.google_rating}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-forest-500">📍 {place.distance_from_center} km away</span>
                                  </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto self-stretch justify-end shrink-0">
                                  <button
                                    onClick={() => handleViewOnMap(place)}
                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-travel-300 hover:bg-travel-50 rounded-lg text-[10px] font-bold text-forest-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Navigation size={10} />
                                    <span>Map</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/place/${place.place_id}`)}
                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-travel-500 hover:bg-travel-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <span>Details</span>
                                    <ChevronRight size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 2. STAYS TAB */}
            {activeTab === 'stay' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-200">
                {stays.map((place: any) => (
                  <PlaceCard 
                    key={place.place_id} 
                    place={place} 
                    category="stay" 
                    renderPrice={renderPriceLevel}
                    getPhoto={getPhotoUrl}
                    onMap={handleViewOnMap}
                    onDetails={() => navigate(`/place/${place.place_id}`)}
                    onAddToExpenses={() => handleQuickAddExpense(place, 'stay')}
                  />
                ))}
                {stays.length === 0 && <EmptyState category="stays" radius={inputs.radius} />}
              </div>
            )}

            {/* 3. EATS TAB */}
            {activeTab === 'eat' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-200">
                {eats.map((place: any) => (
                  <PlaceCard 
                    key={place.place_id} 
                    place={place} 
                    category="eat" 
                    renderPrice={renderPriceLevel}
                    getPhoto={getPhotoUrl}
                    onMap={handleViewOnMap}
                    onDetails={() => navigate(`/place/${place.place_id}`)}
                    onAddToExpenses={() => handleQuickAddExpense(place, 'eat')}
                  />
                ))}
                {eats.length === 0 && <EmptyState category="dining spots" radius={inputs.radius} />}
              </div>
            )}

            {/* 4. SIGHTSEEING VISIT TAB */}
            {activeTab === 'visit' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="space-y-4">
                  <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Sightseeing attractions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {visits.map((place: any) => (
                      <PlaceCard 
                        key={place.place_id} 
                        place={place} 
                        category="visit" 
                        renderPrice={renderPriceLevel}
                        getPhoto={getPhotoUrl}
                        onMap={handleViewOnMap}
                        onDetails={() => navigate(`/place/${place.place_id}`)}
                        onAddToExpenses={() => handleQuickAddExpense(place, 'visit')}
                      />
                    ))}
                    {visits.length === 0 && <EmptyState category="sightseeing spots" radius={inputs.radius} />}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Local spots to roam</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {roams.map((place: any) => (
                      <PlaceCard 
                        key={place.place_id} 
                        place={place} 
                        category="roam" 
                        renderPrice={renderPriceLevel}
                        getPhoto={getPhotoUrl}
                        onMap={handleViewOnMap}
                        onDetails={() => navigate(`/place/${place.place_id}`)}
                        onAddToExpenses={() => handleQuickAddExpense(place, 'roam')}
                      />
                    ))}
                    {roams.length === 0 && <EmptyState category="places to roam" radius={inputs.radius} />}
                  </div>
                </div>
              </div>
            )}

            {/* 5. GETTING AROUND TAB */}
            {activeTab === 'around' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* Transport stations */}
                <div className="space-y-4">
                  <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Bus & Railway Stations</h3>
                  <div className="space-y-3">
                    {transports.map((place: any) => (
                      <div key={place.place_id} className="bg-white p-5 border border-travel-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="text-left space-y-1 flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-forest-950 flex items-center gap-2">
                            <span>{place.name}</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-extrabold rounded-full uppercase">
                              {place.type}
                            </span>
                          </h4>
                          <p className="text-xs text-forest-500">{place.address}</p>
                          <span className="text-[10px] font-semibold text-travel-600 block">📍 {place.distance_from_center} km from center</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(center.lat)},${encodeURIComponent(center.lng)}&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 border border-travel-300 hover:bg-travel-50 rounded-xl text-xs font-bold text-forest-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                        >
                          <Navigation size={12} />
                          <span>Get Directions</span>
                        </a>
                      </div>
                    ))}
                    {transports.length === 0 && <EmptyState category="transport stations" radius={inputs.radius} />}
                  </div>
                </div>

                {/* Bike scooty rentals */}
                <div className="space-y-4">
                  <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2 font-serif">Rent a Bike / Scooty</h3>
                  <div className="space-y-3">
                    {rentals.map((place: any) => (
                      <div key={place.place_id} className="bg-white p-5 border border-travel-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="text-left space-y-1 flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-forest-950">{place.name}</h4>
                          <p className="text-xs text-forest-500">{place.address || 'Address details in town center'}</p>
                          <span className="text-[10px] font-semibold text-travel-600 block">📍 {place.distance_from_center} km from center</span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleViewOnMap(place)}
                            className="px-3 py-2 border border-travel-300 hover:bg-travel-50 rounded-xl text-xs font-bold text-forest-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            Map
                          </button>
                          <button 
                            onClick={() => navigate(`/place/${place.place_id}`)}
                            className="px-4 py-2 bg-travel-500 hover:bg-travel-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                          >
                            Details & Contact
                          </button>
                        </div>
                      </div>
                    ))}
                    {rentals.length === 0 && (
                      <div className="p-5 bg-travel-100/50 text-travel-800 text-xs rounded-2xl border border-travel-200 text-center font-medium">
                        No scooter/bike rentals directly indexed in this radius. Try increasing search radius or searching local transport listings.
                      </div>
                    )}
                  </div>
                </div>

                {/* Travel agencies */}
                <div className="space-y-4">
                  <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Travel Agencies</h3>
                  <div className="space-y-3">
                    {agencies.map((place: any) => (
                      <div key={place.place_id} className="bg-white p-5 border border-travel-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="text-left space-y-1 flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-forest-950">{place.name}</h4>
                          <p className="text-xs text-forest-500">{place.address}</p>
                          <span className="text-[10px] font-semibold text-travel-600 block">📍 {place.distance_from_center} km from center</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleViewOnMap(place)}
                            className="px-3 py-2 border border-travel-300 hover:bg-travel-50 rounded-xl text-xs font-bold text-forest-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            Map
                          </button>
                          <button 
                            onClick={() => navigate(`/place/${place.place_id}`)}
                            className="px-4 py-2 bg-travel-500 hover:bg-travel-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
                          >
                            Details & Contact
                          </button>
                        </div>
                      </div>
                    ))}
                    {agencies.length === 0 && <EmptyState category="travel agencies" radius={inputs.radius} />}
                  </div>
                </div>

              </div>
            )}

            {/* 6. EXPENSES TAB */}
            {activeTab === 'expenses' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {!saved ? (
                  /* Locked Screen */
                  <div className="bg-white rounded-3xl border border-travel-200 p-8 shadow-sm text-center py-12 space-y-6">
                    <div className="w-16 h-16 bg-travel-50 text-travel-500 rounded-full flex items-center justify-center mx-auto border border-travel-100 shadow-inner">
                      <Wallet className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="font-serif font-black text-xl text-forest-950">Unlock Expense Tracker</h3>
                      <p className="text-xs text-forest-600 leading-relaxed">
                        To activate your budget estimator and start tracking your expenses, please confirm and save this trip itinerary. Once saved, you can add custom expenses and estimate your total costs!
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={handleSaveTrip}
                        disabled={saving}
                        className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-full text-xs transition-all shadow-md shadow-travel-500/20 flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        <Heart size={14} className={saving ? 'animate-pulse' : ''} />
                        <span>{saving ? 'Saving Trip...' : 'Confirm & Save Trip Details'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Saved confirmation info banner */}
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-xs text-green-800 flex items-center gap-2">
                      <span>✓ Trip details confirmed! Expenses are auto-saved to your profile.</span>
                    </div>

                    {/* List of Expenses */}
                    <div className="bg-white rounded-3xl border border-travel-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-travel-100 pb-3">
                    <h3 className="font-serif font-black text-lg text-forest-950">Expense Tracker Checklist</h3>
                    <span className="px-2.5 py-0.5 bg-travel-100 text-travel-700 text-xs font-bold rounded-full">
                      {expenses.length} Items
                    </span>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-10 space-y-2 text-forest-500">
                      <Coins className="w-8 h-8 text-travel-400 mx-auto animate-bounce" />
                      <p className="text-xs font-bold">Your expense checklist is empty.</p>
                      <p className="text-[10px] max-w-xs mx-auto text-forest-400">
                        Add items from your recommendations or use the form below to track stays, food, transport, and shopping!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-travel-100 max-h-[380px] overflow-y-auto pr-1">
                      {expenses.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-0.5 text-left">
                            <p className="font-bold text-xs text-forest-950">{item.title}</p>
                            <span className={`inline-block px-2 py-0.5 text-[8px] font-extrabold rounded-full uppercase ${
                              item.category === 'Stay' ? 'bg-blue-100 text-blue-800' :
                              item.category === 'Food' ? 'bg-amber-100 text-amber-800' :
                              item.category === 'Transport' ? 'bg-purple-100 text-purple-800' :
                              item.category === 'Sightseeing' ? 'bg-rose-100 text-rose-800' :
                              item.category === 'Shopping' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.category}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-xs text-forest-950">
                              ₹{item.amount.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => {
                                const updated = expenses.filter(ex => ex.id !== item.id)
                                saveExpensesData(updated)
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Custom Expense Form */}
                <div className="bg-white rounded-3xl border border-travel-200 p-6 shadow-sm space-y-4">
                  <h3 className="font-serif font-black text-base text-forest-950 border-b border-travel-100 pb-2 font-serif">Add Custom Expense</h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!expenseTitle.trim() || !expenseAmount) return
                      const newItem: ExpenseItem = {
                        id: `expense-${Date.now()}`,
                        title: expenseTitle.trim(),
                        amount: Number(expenseAmount),
                        category: expenseCategory
                      }
                      const updated = [newItem, ...expenses]
                      saveExpensesData(updated)
                      setExpenseTitle('')
                      setExpenseAmount('')
                    }}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-5 text-left space-y-1">
                      <label className="text-[10px] font-bold text-forest-600 uppercase">Expense Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flight Tickets, Gift Shopping"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-travel-300 rounded-xl text-xs focus:ring-1 focus:ring-travel-500 focus:outline-none bg-white"
                      />
                    </div>
                    
                    <div className="sm:col-span-3 text-left space-y-1">
                      <label className="text-[10px] font-bold text-forest-600 uppercase">Cost (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="Amount"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-travel-300 rounded-xl text-xs focus:ring-1 focus:ring-travel-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 text-left space-y-1">
                      <label className="text-[10px] font-bold text-forest-600 uppercase">Category</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as any)}
                        className="w-full px-2 py-2 border border-travel-300 rounded-xl text-xs focus:ring-1 focus:ring-travel-500 focus:outline-none bg-white"
                      >
                        <option value="Stay">Stay</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Sightseeing">Sightseeing</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="sm:col-span-2 w-full py-2 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-travel-500/10"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Google Map Sticky Widget (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 h-[550px] space-y-4">
            {activeTab === 'expenses' && saved ? (
              <div className="space-y-4 overflow-y-auto h-full pr-1 pb-4">
                {/* 1. Summary Cards */}
                <div className="bg-white rounded-3xl border border-travel-200 p-5 shadow-sm space-y-4">
                  <span className="text-xs font-bold text-forest-950 uppercase tracking-wider block text-left">Estimated Budget Overview</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-travel-50/50 p-3 rounded-2xl border border-travel-150 text-left">
                      <span className="text-[9px] font-extrabold text-forest-600 uppercase block">Total Trip Budget</span>
                      <span className="font-mono font-black text-lg text-forest-950">
                        ₹{(inputs.budgetType === 'total' ? inputs.budgetValue : inputs.budgetValue * inputs.days).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-travel-50/50 p-3 rounded-2xl border border-travel-150 text-left">
                      <span className="text-[9px] font-extrabold text-forest-600 uppercase block">Total Expense</span>
                      <span className="font-mono font-black text-lg text-forest-950 text-travel-600">
                        ₹{expenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Balance / Remaining */}
                  {(() => {
                    const totalB = inputs.budgetType === 'total' ? inputs.budgetValue : inputs.budgetValue * inputs.days;
                    const totalS = expenses.reduce((sum, item) => sum + item.amount, 0);
                    const bal = totalB - totalS;
                    const pct = Math.min((totalS / totalB) * 100, 100);
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-forest-750">Budget Allocated:</span>
                          <span className={bal >= 0 ? 'text-green-600 font-mono text-[11px]' : 'text-red-500 font-mono text-[11px]'}>
                            {bal >= 0 ? `₹${bal.toLocaleString('en-IN')} Left` : `₹${Math.abs(bal).toLocaleString('en-IN')} Over Budget!`}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              pct >= 100 ? 'bg-red-500' : pct > 85 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-forest-500 italic text-left">
                          {pct >= 100 
                            ? "⚠️ Alert: Your planned expenses have exceeded your target budget!" 
                            : `You have allocated ${Math.round(pct)}% of your estimated trip budget.`
                          }
                        </p>
                      </div>
                    )
                  })()}
                </div>

                {/* 2. Category Allocations */}
                <div className="bg-white rounded-3xl border border-travel-200 p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-forest-950 uppercase tracking-wider block text-left">Allocation by Category</span>
                  
                  {(() => {
                    const cats = ['Stay', 'Food', 'Transport', 'Sightseeing', 'Shopping', 'Other']
                    const totalS = expenses.reduce((sum, item) => sum + item.amount, 0) || 1
                    
                    return (
                      <div className="space-y-2 text-xs font-bold">
                        {cats.map(cat => {
                          const catTotal = expenses.filter(i => i.category === cat).reduce((sum, i) => sum + i.amount, 0)
                          const pct = (catTotal / totalS) * 100
                          if (catTotal === 0) return null
                          
                          return (
                            <div key={cat} className="space-y-1 text-left">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-forest-750">{cat}</span>
                                <span className="text-forest-950 font-mono text-[11px]">₹{catTotal.toLocaleString('en-IN')} ({Math.round(pct)}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    cat === 'Stay' ? 'bg-blue-500' :
                                    cat === 'Food' ? 'bg-amber-500' :
                                    cat === 'Transport' ? 'bg-purple-500' :
                                    cat === 'Sightseeing' ? 'bg-rose-500' :
                                    cat === 'Shopping' ? 'bg-emerald-500' :
                                    'bg-gray-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                        {expenses.length === 0 && (
                          <p className="text-[10px] text-forest-500 italic text-center py-2">No category allocations to display.</p>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* 3. Quick-Add Recommended Places */}
                <div className="bg-white rounded-3xl border border-travel-200 p-5 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-forest-950 uppercase tracking-wider block text-left">Quick-Add Stays & Attractions</span>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 text-left">
                    {[
                      ...stays.slice(0, 3).map((s: any) => ({ ...s, cat: 'stay' })),
                      ...eats.slice(0, 3).map((e: any) => ({ ...e, cat: 'eat' })),
                      ...visits.slice(0, 4).map((v: any) => ({ ...v, cat: 'visit' }))
                    ].map((place: any) => {
                      const alreadyAdded = expenses.some(item => item.title.includes(place.name) || place.name.includes(item.title))
                      if (alreadyAdded) return null

                      return (
                        <div key={place.place_id} className="p-2 border border-travel-150 rounded-xl hover:bg-travel-50/50 flex items-center justify-between gap-3 text-xs">
                          <div className="truncate space-y-0.5">
                            <p className="font-bold text-forest-950 truncate">{place.name}</p>
                            <span className="text-[9px] font-bold text-forest-500 capitalize">{place.cat} • {renderPriceLevel(place.price_level)}</span>
                          </div>
                          
                          <button
                            onClick={() => handleQuickAddExpense(place, place.cat)}
                            className="px-2 py-1 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-lg text-[9px] transition-colors cursor-pointer flex items-center gap-0.5 shrink-0"
                          >
                            <Plus size={10} />
                            <span>Add</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-white px-5 py-3 border border-travel-200 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-forest-950 uppercase tracking-wider">Map Visualizer</span>
                  <div className="flex items-center gap-3">
                    {focusedPlace && (
                      <button
                        onClick={() => setFocusedPlace(null)}
                        className="px-2 py-1 bg-travel-100 hover:bg-travel-200 text-travel-700 font-bold rounded-lg text-[9px] transition-colors cursor-pointer"
                      >
                        Reset View
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-travel-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-travel-500 inline-block"></span>
                      <span>{inputs.radius} km radius circle</span>
                    </div>
                  </div>
                </div>
                
                <InteractiveMap 
                  center={center}
                  radiusKm={inputs.radius}
                  markers={compileMarkers()}
                  activeCategory={getMapActiveCategory()}
                  focusedPlace={focusedPlace}
                />

                {/* Color coding legend */}
                <div className="bg-white p-4 border border-travel-200 rounded-2xl shadow-sm grid grid-cols-3 sm:grid-cols-4 gap-2 text-[10px] font-bold text-forest-850">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D5A50]" />
                    <span>Stay</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F]" />
                    <span>Eat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4A90E2]" />
                    <span>Visit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B572A]" />
                    <span>Roam</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C5295]" />
                    <span>Transport</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
                    <span>Rental</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  )
}

/* Sub components to keep code clean */

const LoaderComponent = () => (
  <div className="text-center space-y-4">
    <div className="w-12 h-12 border-4 border-travel-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    <p className="text-sm font-bold text-forest-700 font-serif">Loading results...</p>
  </div>
)

const EmptyState: React.FC<{ category: string; radius: number }> = ({ category, radius }) => (
  <div className="col-span-2 bg-white p-8 rounded-3xl border border-travel-200 text-center space-y-2">
    <Compass className="w-10 h-10 text-travel-400 mx-auto animate-spin-slow" />
    <h4 className="font-bold text-sm text-forest-950 font-serif">No {category} found</h4>
    <p className="text-xs text-forest-500 max-w-sm mx-auto leading-relaxed">
      No matching places were found within your {radius} km search radius. Try regenerating with a larger search radius!
    </p>
  </div>
)

interface PlaceCardProps {
  place: any;
  category: string;
  renderPrice: (level?: number) => string;
  getPhoto: (ref?: string, place?: any) => string;
  onMap: (place: any) => void;
  onDetails: () => void;
  onAddToExpenses?: (place: any) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  category: _category,
  renderPrice,
  getPhoto,
  onMap,
  onDetails,
  onAddToExpenses
}) => {
  const [imageError, setImageError] = useState(false);
  const cat = place.type || 'visit';

  const renderCategoryIcon = () => {
    const iconClass = "w-8 h-8 text-forest-500/70";
    if (cat === 'stay') return <Hotel className={iconClass} />;
    if (cat === 'eat') return <Utensils className={iconClass} />;
    return <Compass className={iconClass} />;
  };

  return (
    <div className="bg-white rounded-3xl border border-travel-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group h-full">
      {/* Photo */}
      <div className="h-40 w-full overflow-hidden relative bg-travel-50 shrink-0 border-b border-travel-100 flex items-center justify-center">
        {imageError ? (
          <div className="w-full h-full bg-gradient-to-br from-travel-50 to-travel-100/50 flex flex-col items-center justify-center space-y-2 select-none">
            {renderCategoryIcon()}
            <span className="text-[10px] font-bold text-forest-400 uppercase tracking-wide">No photo available</span>
          </div>
        ) : (
          <img 
            src={getPhoto(place.photo_refs && place.photo_refs[0], place)} 
            alt={place.name} 
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        )}
        {place.score && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider">
            Match: {Math.round(place.score * 100)}%
          </span>
        )}
      </div>

      {/* Details body */}
      <div className="p-5 flex-1 flex flex-col justify-between text-left space-y-4">
        <div className="space-y-1.5">
          <h4 className="font-serif font-black text-base text-forest-950 group-hover:text-travel-600 transition-colors line-clamp-1 leading-snug">
            {place.name}
          </h4>
          <p className="text-[11px] text-forest-500 line-clamp-1">{place.address}</p>
          
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-forest-750">
            {place.google_rating !== undefined && (
              <span className="text-yellow-600 flex items-center gap-0.5">
                ★ {place.google_rating} {place.user_ratings_total ? `(${place.user_ratings_total})` : ''}
              </span>
            )}
            <span>•</span>
            <span className="text-travel-600 font-semibold">{renderPrice(place.price_level)}</span>
            <span>•</span>
            <span className="text-forest-500 font-semibold">📍 {place.distance_from_center} km away</span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-travel-50">
          <button
            onClick={() => onMap(place)}
            className="flex-1 px-3 py-2 bg-white border border-travel-300 hover:bg-travel-50 rounded-xl text-[10px] font-bold text-forest-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Navigation size={10} />
            <span>View on Map</span>
          </button>
          
          <button
            onClick={onDetails}
            className="flex-1 px-3 py-2 bg-travel-500 hover:bg-travel-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Details</span>
            <ChevronRight size={10} />
          </button>

          {onAddToExpenses && (
            <button
              onClick={() => onAddToExpenses(place)}
              title="Add to Expense Tracker"
              className="px-2.5 py-2 bg-travel-50 hover:bg-travel-100 text-travel-700 border border-travel-200 rounded-xl text-[10px] font-bold transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              <Plus size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
