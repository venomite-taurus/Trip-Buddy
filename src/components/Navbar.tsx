import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'
import { Compass, Menu, X, User, LogOut, Briefcase } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsProfileDropdownOpen(false)
    navigate('/')
  }

  const handleProtectedNavigation = (path: string) => {
    setIsMobileMenuOpen(false)
    if (!user) {
      setIsAuthOpen(true)
    } else {
      navigate(path)
    }
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-travel-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-travel-500 flex items-center justify-center text-white shadow-md shadow-travel-500/20 group-hover:scale-105 transition-transform duration-200">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <span className="font-serif font-bold text-xl text-forest-950 tracking-tight">Trip Buddy</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to="/" 
                className={`text-sm font-semibold transition-colors ${
                  isActive('/') 
                    ? 'text-travel-600 bg-travel-100/60 px-3.5 py-1.5 rounded-full' 
                    : 'text-forest-700 hover:text-travel-600'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/plan" 
                className={`text-sm font-semibold transition-colors ${
                  isActive('/plan') 
                    ? 'text-travel-600 bg-travel-100/60 px-3.5 py-1.5 rounded-full' 
                    : 'text-forest-700 hover:text-travel-600'
                }`}
              >
                Plan a Trip
              </Link>
              
              <button 
                onClick={() => handleProtectedNavigation('/my-trips')}
                className={`text-sm font-semibold transition-colors text-left focus:outline-none ${
                  isActive('/my-trips') 
                    ? 'text-travel-600 bg-travel-100/60 px-3.5 py-1.5 rounded-full' 
                    : 'text-forest-700 hover:text-travel-600'
                }`}
              >
                My Trips
              </button>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 bg-travel-50 border border-travel-200 rounded-full hover:bg-travel-100 hover:border-travel-300 transition-all focus:outline-none cursor-pointer"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-7 h-7 rounded-full object-cover border border-travel-300"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-travel-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-bold text-forest-900 max-w-[100px] truncate">{user.name}</span>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-travel-200 py-1.5 animate-in fade-in slide-in-from-top-3 duration-250">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-travel-100 transition-colors"
                      >
                        <User size={16} className="text-travel-500" />
                        <span>Profile & Reviews</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleProtectedNavigation('/my-trips');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-travel-100 transition-colors text-left"
                      >
                        <Briefcase size={16} className="text-travel-500" />
                        <span>My Trips</span>
                      </button>
                      <div className="border-t border-travel-200 my-1"></div>
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="text-sm font-semibold text-forest-800 hover:text-travel-600 px-4 py-2"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => setIsAuthOpen(true)}
                    className="text-sm font-bold bg-travel-500 hover:bg-travel-600 text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-travel-500/15 hover:shadow-lg hover:shadow-travel-500/20 active:scale-95"
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-forest-800 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-travel-200 py-4 px-6 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-4">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-xl ${
                  isActive('/') ? 'text-travel-600 bg-travel-100/50' : 'text-forest-700'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/plan" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-semibold py-2 px-3 rounded-xl ${
                  isActive('/plan') ? 'text-travel-600 bg-travel-100/50' : 'text-forest-700'
                }`}
              >
                Plan a Trip
              </Link>
              <button 
                onClick={() => handleProtectedNavigation('/my-trips')}
                className={`text-sm text-left font-semibold py-2 px-3 rounded-xl ${
                  isActive('/my-trips') ? 'text-travel-600 bg-travel-100/50' : 'text-forest-700'
                }`}
              >
                My Trips
              </button>

              <div className="border-t border-travel-200 my-2"></div>

              {user ? (
                <>
                  <Link 
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 py-2 px-3 text-sm font-semibold text-forest-700"
                  >
                    <User size={16} className="text-travel-500" />
                    <span>Profile & Reviews</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 py-2 px-3 text-sm font-semibold text-red-600 text-left"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3.5 pt-2">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthOpen(true);
                    }}
                    className="w-full text-center py-2.5 border border-travel-300 rounded-xl text-sm font-semibold text-forest-800"
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthOpen(true);
                    }}
                    className="w-full text-center py-2.5 bg-travel-500 text-white rounded-xl text-sm font-bold shadow-md shadow-travel-500/10"
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
