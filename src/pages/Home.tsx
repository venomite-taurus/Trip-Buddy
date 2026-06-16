import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { 
  ArrowRight, 
  MapPin, 
  Wallet, 
  Compass, 
  Hotel, 
  Utensils, 
  Camera, 
  Bike, 
  Star 
} from 'lucide-react'

export const Home: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const handlePlanClick = () => {
    navigate('/plan')
  }

  const handleSignInClick = () => {
    if (user) {
      navigate('/plan')
    } else {
      setIsAuthOpen(true)
    }
  }

  return (
    <div className="bg-travel-50 min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('/home_hero_banner.png')", 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/40 to-forest-950/80" />

        {/* Content Container */}
        <div className="relative max-w-4xl mx-auto text-center text-white z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-travel-500 animate-ping"></span>
            Travel planner for India
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black font-serif leading-tight max-w-3xl mx-auto drop-shadow-md">
            Plan a trip you'll actually want to take.
          </h1>
          
          <p className="text-lg sm:text-xl text-travel-100/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Tell us your destination, days, and budget. Trip Buddy curates the right stays, food, sights and rides — all within your radius.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={handlePlanClick}
              className="w-full sm:w-auto px-8 py-4 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-travel-500/35 flex items-center justify-center gap-2 group text-base cursor-pointer hover:scale-[1.03] active:scale-95"
            >
              <span>Plan my trip</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
            
            {!user && (
              <button 
                onClick={handleSignInClick}
                className="w-full sm:w-auto px-8 py-4 bg-white/95 hover:bg-white text-forest-950 font-bold rounded-full transition-all shadow-md flex items-center justify-center gap-2 text-base cursor-pointer hover:scale-[1.03] active:scale-95"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-travel-500">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 font-serif">
            Three inputs. One thoughtful itinerary.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl border border-travel-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
            <div className="w-12 h-12 rounded-2xl bg-travel-100 flex items-center justify-center text-travel-600">
              <MapPin size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-forest-950">Pick a destination</h3>
              <p className="text-sm text-forest-700 leading-relaxed">
                Search any town or city in India. Set the radius you're willing to roam.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl border border-travel-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
            <div className="w-12 h-12 rounded-2xl bg-travel-100 flex items-center justify-center text-travel-600">
              <Wallet size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-forest-950">Set days & budget</h3>
              <p className="text-sm text-forest-700 leading-relaxed">
                Per-day or total budget, with separate tiers for stay and food.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl border border-travel-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5">
            <div className="w-12 h-12 rounded-2xl bg-travel-100 flex items-center justify-center text-travel-600">
              <Compass size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-forest-950">Get your trip</h3>
              <p className="text-sm text-forest-700 leading-relaxed">
                A day-wise itinerary plus stays, eats, sights, transport and rentals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Covered Section */}
      <section className="py-20 bg-travel-100/40 border-y border-travel-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text block */}
          <div className="space-y-5 max-w-xl text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest-600">Everything you need</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 font-serif leading-tight">
              Covered, end to end.
            </h2>
            <p className="text-sm sm:text-base text-forest-750 leading-relaxed">
              Each place gets its own page with community photos and reviews from travellers who've actually been there.
            </p>
            <button 
              onClick={handlePlanClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-forest-500 hover:bg-forest-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
            >
              <span>Start planning</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:max-w-xl">
            {/* Stay Badge */}
            <div className="bg-white p-5 rounded-2xl border border-travel-200 flex items-start gap-4 shadow-sm hover:translate-y-[-2px] transition-transform">
              <div className="p-3 rounded-xl bg-travel-50 text-travel-600">
                <Hotel size={20} />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-serif font-bold text-base text-forest-950">Places to stay</h4>
                <p className="text-xs text-forest-500">Budget • Mid • Luxury</p>
              </div>
            </div>

            {/* Eat Badge */}
            <div className="bg-white p-5 rounded-2xl border border-travel-200 flex items-start gap-4 shadow-sm hover:translate-y-[-2px] transition-transform">
              <div className="p-3 rounded-xl bg-travel-50 text-travel-600">
                <Utensils size={20} />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-serif font-bold text-base text-forest-950">Places to eat</h4>
                <p className="text-xs text-forest-500">Street to fine-dining</p>
              </div>
            </div>

            {/* Visit Badge */}
            <div className="bg-white p-5 rounded-2xl border border-travel-200 flex items-start gap-4 shadow-sm hover:translate-y-[-2px] transition-transform">
              <div className="p-3 rounded-xl bg-travel-50 text-travel-600">
                <Camera size={20} />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-serif font-bold text-base text-forest-950">Places to visit</h4>
                <p className="text-xs text-forest-500">Sights, parks, temples</p>
              </div>
            </div>

            {/* Get Around Badge */}
            <div className="bg-white p-5 rounded-2xl border border-travel-200 flex items-start gap-4 shadow-sm hover:translate-y-[-2px] transition-transform">
              <div className="p-3 rounded-xl bg-travel-50 text-travel-600">
                <Bike size={20} />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-serif font-bold text-base text-forest-950">Getting around</h4>
                <p className="text-xs text-forest-500">Rentals & stations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA Banner Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-travel-500 to-travel-600 p-8 sm:p-16 rounded-[2.5rem] text-white text-left shadow-xl shadow-travel-500/25 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Star size={20} className="fill-white text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight">
              Built with the wisdom of travellers before you.
            </h2>
            <p className="text-travel-100 text-sm sm:text-base leading-relaxed">
              Every recommended place has a community feedback wall with real photos and honest ratings — so you book with confidence.
            </p>
          </div>
          <button 
            onClick={handlePlanClick}
            className="w-full md:w-auto px-8 py-4 bg-white hover:bg-travel-50 text-travel-700 font-bold rounded-full transition-all shadow-md hover:scale-[1.03] text-sm shrink-0 cursor-pointer"
          >
            Plan my trip
          </button>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-travel-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-center text-sm text-forest-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-travel-500 flex items-center justify-center text-white">
              <Compass size={16} />
            </div>
            <span className="font-serif font-bold text-base text-forest-950">Trip Buddy</span>
          </div>
          <div className="font-medium">
            © 2026 Trip Buddy. Made for India.
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  )
}
