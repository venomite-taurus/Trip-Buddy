import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete'
import { 
  ArrowLeft, 
  ArrowRight, 
  Calendar, 
  Map, 
  Wallet, 
  Check, 
  Users, 
  Car, 
  Compass,
  Sparkles
} from 'lucide-react'

// Step indicators
const STEPS = [
  { id: 1, label: 'Destination' },
  { id: 2, label: 'Days & Budget' },
  { id: 3, label: 'Style & Group' },
  { id: 4, label: 'Review' }
]

const PREFERENCE_OPTIONS = [
  { id: 'Nature', label: 'Nature 🌳' },
  { id: 'Heritage', label: 'Heritage & History 🏛️' },
  { id: 'Adventure', label: 'Adventure 🧗' },
  { id: 'Spiritual', label: 'Spiritual & Temples 🛕' },
  { id: 'Beaches', label: 'Beaches 🏖️' },
  { id: 'Hill Stations', label: 'Hill Stations 🏔️' },
  { id: 'Wildlife', label: 'Wildlife & Safari 🦁' },
  { id: 'Shopping', label: 'Shopping 🛍️' },
  { id: 'Nightlife', label: 'Nightlife 🍻' },
  { id: 'Food', label: 'Food Tourism 🍛' }
]

const GROUP_OPTIONS = [
  { id: 'solo', label: 'Solo 🧘', description: 'Hostels & safety-rated spots' },
  { id: 'couple', label: 'Couple 💑', description: 'Romantic & scenic areas' },
  { id: 'family', label: 'Family 👨‍👩‍👧‍👦', description: 'Kid-friendly places' },
  { id: 'friends', label: 'Friends group 👥', description: 'Group stays & nightlife' }
]

const MODE_OPTIONS = [
  { id: 'self-drive', label: 'Self-drive 🚗', description: 'Prefer driving/parking' },
  { id: 'public', label: 'Public transport 🚌', description: 'Highlight stations' },
  { id: 'rent', label: 'Rent a vehicle 🛵', description: 'Emphasize rental shops' }
]

export const PlanTrip: React.FC = () => {
  const navigate = useNavigate()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Planning your trip...')

  // Step 1: Destination
  const [destination, setDestination] = useState('')

  // Step 2: Days & Budget & Radius
  const [days, setDays] = useState(3)
  const [radius, setRadius] = useState(10) // default 10 km
  const [budgetType, setBudgetType] = useState<'total' | 'per_day'>('per_day')
  const [budgetValue, setBudgetValue] = useState(3000) // default ₹3000
  const [stayBudgetCategory, setStayBudgetCategory] = useState<'budget' | 'mid-range' | 'luxury'>('mid-range')
  const [foodBudgetCategory, setFoodBudgetCategory] = useState<'street' | 'mid-range' | 'fine'>('mid-range')

  // Step 3: Preferences & Group Type & Mode
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'friends'>('solo')
  const [travelMode, setTravelMode] = useState<'self-drive' | 'public' | 'rent'>('rent')
  const [notes, setNotes] = useState('')

  // Auto-suggest stay/food budget based on per-day budget
  const handleBudgetValueChange = (val: number) => {
    setBudgetValue(val)
    
    // Auto suggesting logic
    const perDayVal = budgetType === 'total' ? val / days : val
    if (perDayVal < 1500) {
      setStayBudgetCategory('budget')
      setFoodBudgetCategory('street')
    } else if (perDayVal >= 1500 && perDayVal < 6000) {
      setStayBudgetCategory('mid-range')
      setFoodBudgetCategory('mid-range')
    } else {
      setStayBudgetCategory('luxury')
      setFoodBudgetCategory('fine')
    }
  }

  const togglePreference = (pref: string) => {
    setSelectedPrefs(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    )
  }

  const nextStep = () => {
    if (currentStep === 1 && !destination) {
      alert('Please select a destination to proceed!')
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setLoadingMessage('Initializing recommendation engine...')
    
    const tripPrefs = {
      destination,
      days,
      radius,
      budgetType,
      budgetValue,
      stayBudgetCategory,
      foodBudgetCategory,
      preferences: selectedPrefs,
      groupType,
      travelMode,
      notes
    }

    try {
      // Step-by-step loading animation simulation
      setTimeout(() => setLoadingMessage('Geocoding coordinates in India...'), 1200)
      setTimeout(() => setLoadingMessage('Querying Google Places nearby stays & restaurants...'), 2400)
      setTimeout(() => setLoadingMessage('Applying weighted scoring algorithm to options...'), 3800)
      setTimeout(() => setLoadingMessage('Performing K-Means clustering for day-wise itinerary...'), 5000)

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tripPrefs)
      })
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Save generated trip and inputs in localStorage for reload safety
      localStorage.setItem('active_trip_inputs', JSON.stringify(tripPrefs))
      localStorage.setItem('active_trip_results', JSON.stringify(data))
      localStorage.removeItem('active_trip_id')
      localStorage.removeItem('active_trip_expenses')
      localStorage.removeItem('active_trip_tab')

      setTimeout(() => {
        setLoading(false)
        navigate('/results')
      }, 6200)

    } catch (err: any) {
      console.error(err)
      alert(`Trip Generation failed: ${err.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <div className="bg-travel-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {loading ? (
        /* Animated Loading Screen */
        <div className="max-w-md mx-auto my-16 bg-white border border-travel-200 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-8 animate-pulse">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-travel-100 border-t-travel-500 animate-spin"></div>
            <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-travel-500 animate-spin-slow" size={36} />
          </div>
          <div className="space-y-3">
            <h2 className="font-serif font-black text-2xl text-forest-950">Curating your adventure...</h2>
            <p className="text-sm text-forest-600 font-medium h-8 animate-bounce">{loadingMessage}</p>
          </div>
          <div className="w-full bg-travel-100 h-2 rounded-full overflow-hidden">
            <div className="bg-travel-500 h-full w-2/3 rounded-full animate-infinite-scroll"></div>
          </div>
        </div>
      ) : (
        /* Planning Form Wizard */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-travel-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-travel-500 to-travel-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold font-serif">Plan your trip</h1>
            <p className="text-travel-100 text-sm mt-1">A few quick questions — we'll handle the rest.</p>
          </div>

          {/* Stepper Progress bar */}
          <div className="flex justify-between items-center px-8 py-5 bg-travel-100/40 border-b border-travel-200 overflow-x-auto whitespace-nowrap">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep === step.id 
                      ? 'bg-travel-500 text-white shadow shadow-travel-500/30' 
                      : currentStep > step.id 
                        ? 'bg-forest-500 text-white' 
                        : 'bg-travel-200 text-travel-600'
                  }`}>
                    {currentStep > step.id ? <Check size={14} /> : step.id}
                  </div>
                  <span className={`text-xs font-bold ${
                    currentStep === step.id ? 'text-travel-600' : 'text-forest-700'
                  }`}>{step.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-[1px] w-6 sm:w-12 border-t ${
                    currentStep > step.id ? 'border-forest-500' : 'border-travel-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Contents */}
          <div className="p-8 sm:p-10 min-h-[350px]">
            {/* STEP 1: Destination Autocomplete */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-2 text-left">
                  <h2 className="text-2xl font-bold font-serif text-forest-950">Where to in India?</h2>
                  <p className="text-sm text-forest-600">A city, town or region works. You can refine later.</p>
                </div>
                <div className="pt-2">
                  <GooglePlacesAutocomplete 
                    value={destination}
                    onChange={(val) => setDestination(val)}
                    placeholder="e.g. Jaipur, Rishikesh, Goa, Munnar..."
                  />
                </div>
                <div className="text-left space-y-2">
                  <span className="text-xs font-bold text-travel-400 uppercase tracking-wider">Try popular spots</span>
                  <div className="flex flex-wrap gap-2.5">
                    {['Jaipur', 'Goa', 'Udaipur', 'Rishikesh', 'Pondicherry', 'Munnar'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setDestination(city + (city === 'Jaipur' || city === 'Udaipur' ? ', Rajasthan' : city === 'Munnar' ? ', Kerala' : ''))}
                        className="px-4 py-2 bg-travel-50 hover:bg-travel-100 border border-travel-200 rounded-full text-xs font-semibold text-forest-800 transition-colors cursor-pointer"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Days, Radius & Budget */}
            {currentStep === 2 && (
              <div className="space-y-8 text-left animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-serif text-forest-950">Days, Budget & Radius</h2>
                  <p className="text-xs text-forest-500">Configure parameters to narrow down recommendations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Days Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-forest-800 flex items-center gap-2">
                      <Calendar size={16} className="text-travel-500" />
                      Number of days
                    </label>
                    <input 
                      type="number"
                      min={1}
                      max={30}
                      value={days}
                      onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-full px-4 py-3 bg-travel-50 border border-travel-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 text-sm font-semibold"
                    />
                    <span className="text-[10px] text-forest-500 block">Plan itineraries between 1 and 30 days.</span>
                  </div>

                  {/* Radius Slider */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-forest-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Map size={16} className="text-travel-500" />
                        Search Radius
                      </span>
                      <span className="text-xs bg-travel-100 text-travel-700 font-bold px-2 py-0.5 rounded-full">{radius} km</span>
                    </label>
                    <div className="pt-2.5">
                      <input 
                        type="range"
                        min={1}
                        max={25}
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full accent-travel-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-forest-500 block">Distance radius from destination center.</span>
                  </div>
                </div>

                {/* Budget Selection block */}
                <div className="border-t border-travel-200 pt-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="text-sm font-bold text-forest-800 flex items-center gap-2">
                      <Wallet size={16} className="text-travel-500" />
                      Budget preference (₹)
                    </label>
                    <div className="flex bg-travel-100 p-1 rounded-full border border-travel-200">
                      <button
                        type="button"
                        onClick={() => { setBudgetType('per_day'); handleBudgetValueChange(3000) }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          budgetType === 'per_day' ? 'bg-white text-travel-600 shadow-sm' : 'text-forest-600 hover:text-travel-500'
                        }`}
                      >
                        Per-Day
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBudgetType('total'); handleBudgetValueChange(10000) }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                          budgetType === 'total' ? 'bg-white text-travel-600 shadow-sm' : 'text-forest-600 hover:text-travel-500'
                        }`}
                      >
                        Total Trip
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    <div>
                      <input 
                        type="number"
                        min={1}
                        value={budgetValue === 0 ? '' : budgetValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setBudgetValue(0);
                            return;
                          }
                          handleBudgetValueChange(Number(val));
                        }}
                        className="w-full px-4 py-3 bg-travel-50 border border-travel-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 text-lg font-bold"
                      />
                      <span className="text-[10px] text-forest-500 mt-1 block">
                        Equivalent to ₹{budgetType === 'total' ? Math.round(budgetValue / days) : budgetValue} per day.
                      </span>
                    </div>

                    <div className="p-4 bg-travel-100/30 border border-travel-200 rounded-2xl space-y-1.5">
                      <div className="text-xs font-bold text-forest-800 flex justify-between">
                        <span>Stay Preference:</span>
                        <span className="text-travel-600 capitalize">{stayBudgetCategory}</span>
                      </div>
                      <div className="text-xs font-bold text-forest-800 flex justify-between">
                        <span>Dining Preference:</span>
                        <span className="text-travel-600 capitalize">
                          {foodBudgetCategory === 'street' ? 'Street/Local' : foodBudgetCategory === 'fine' ? 'Fine Dining' : 'Mid-Range'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overriding budget categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-travel-50 p-5 rounded-2xl border border-travel-200 text-xs">
                    <div className="space-y-2">
                      <label className="font-bold text-forest-700">Stay Budget Tier</label>
                      <select 
                        value={stayBudgetCategory}
                        onChange={(e) => setStayBudgetCategory(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-travel-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-travel-500 font-semibold"
                      >
                        <option value="budget">Budget (Hostels / Homestays)</option>
                        <option value="mid-range">Mid-range (Standard Hotels)</option>
                        <option value="luxury">Luxury (Resorts / Premium Hotels)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="font-bold text-forest-700">Dining Budget Tier</label>
                      <select 
                        value={foodBudgetCategory}
                        onChange={(e) => setFoodBudgetCategory(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-travel-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-travel-500 font-semibold"
                      >
                        <option value="street">Street food / local eateries</option>
                        <option value="mid-range">Mid-range cafes & restaurants</option>
                        <option value="fine">Fine dining & buffets</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Travel Preferences & Style */}
            {currentStep === 3 && (
              <div className="space-y-8 text-left animate-in fade-in duration-200">
                {/* Style Preferences (Multi-select) */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold font-serif text-forest-950">Travel Style & Preferences</h2>
                  <p className="text-xs text-forest-500">Select categories to boost relevant sightseeing scores.</p>
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {PREFERENCE_OPTIONS.map((pref) => {
                      const isSelected = selectedPrefs.includes(pref.id)
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => togglePreference(pref.id)}
                          className={`px-4 py-2.5 border rounded-full text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-travel-500 border-travel-500 text-white shadow-sm' 
                              : 'bg-white border-travel-200 text-forest-800 hover:bg-travel-50'
                          }`}
                        >
                          {pref.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Group Type */}
                <div className="border-t border-travel-200 pt-6 space-y-3">
                  <h3 className="text-sm font-bold text-forest-800 flex items-center gap-2">
                    <Users size={16} className="text-travel-500" />
                    Who are you travelling with?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GROUP_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGroupType(opt.id as any)}
                        className={`p-4 border text-left rounded-2xl cursor-pointer transition-all ${
                          groupType === opt.id 
                            ? 'bg-travel-50/50 border-travel-500 ring-2 ring-travel-500/10' 
                            : 'bg-white border-travel-200 hover:bg-travel-50/30'
                        }`}
                      >
                        <div className="font-bold text-sm text-forest-950">{opt.label}</div>
                        <div className="text-[10px] text-forest-500 mt-0.5">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode preference */}
                <div className="border-t border-travel-200 pt-6 space-y-3">
                  <h3 className="text-sm font-bold text-forest-800 flex items-center gap-2">
                    <Car size={16} className="text-travel-500" />
                    Preferred travel mode
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTravelMode(opt.id as any)}
                        className={`p-4 border text-left rounded-2xl cursor-pointer transition-all ${
                          travelMode === opt.id 
                            ? 'bg-travel-50/50 border-travel-500 ring-2 ring-travel-500/10' 
                            : 'bg-white border-travel-200 hover:bg-travel-50/30'
                        }`}
                      >
                        <div className="font-bold text-sm text-forest-950">{opt.label}</div>
                        <div className="text-[10px] text-forest-500 mt-0.5 leading-relaxed">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review Inputs */}
            {currentStep === 4 && (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-serif text-forest-950">Looks good?</h2>
                  <p className="text-xs text-forest-500">Review and add anything we should know.</p>
                </div>

                <div className="border border-travel-200 rounded-2xl bg-white overflow-hidden divide-y divide-travel-150 text-sm">
                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs font-bold text-forest-500">Destination</span>
                    <span className="font-bold text-forest-950">{destination}</span>
                  </div>

                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs font-bold text-forest-500">Duration</span>
                    <span className="font-bold text-forest-950">{days} days</span>
                  </div>

                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs font-bold text-forest-500">Budget</span>
                    <span className="font-bold text-forest-950">
                      ₹{(budgetType === 'total' ? budgetValue : budgetValue * days).toLocaleString('en-IN')} · ₹{(budgetType === 'total' ? Math.round(budgetValue / days) : budgetValue).toLocaleString('en-IN')}/day
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs font-bold text-forest-500">Travelling as</span>
                    <span className="font-bold text-forest-950 capitalize">{groupType}</span>
                  </div>

                  <div className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-xs font-bold text-forest-500">Interests</span>
                    <span className="font-bold text-forest-950 capitalize">
                      {selectedPrefs.join(' · ') || 'No specific interests'}
                    </span>
                  </div>
                </div>

                {/* Anything else? (optional) textarea */}
                <div className="space-y-2 pt-2 text-left">
                  <label htmlFor="notes-textarea" className="text-xs font-bold text-forest-950 block">
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="notes-textarea"
                    maxLength={300}
                    placeholder="Allergies, accessibility, must-see places..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 p-4 border border-travel-200 rounded-2xl text-xs focus:ring-1 focus:ring-travel-500 focus:outline-none bg-white resize-none"
                  />
                  <span className="text-[10px] text-forest-400 block text-right">
                    {notes.length}/300
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between px-8 py-5 border-t border-travel-200 bg-travel-50/50">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 border border-travel-300 hover:bg-travel-100 rounded-full font-bold text-xs text-forest-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-travel-500 hover:bg-travel-600 text-white rounded-full font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-lg"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white rounded-full font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-98"
              >
                <span>Build my trip</span>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
