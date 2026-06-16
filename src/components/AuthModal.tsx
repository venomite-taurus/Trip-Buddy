import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Mail, Lock, Compass } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle, isMock } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let res
      if (isSignUp) {
        res = await signUp(email, password)
      } else {
        res = await signIn(email, password)
      }

      if (res.error) {
        setError(res.error.message || 'Authentication failed. Please try again.')
      } else {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await signInWithGoogle()
      if (res.error) {
        setError(res.error.message || 'Google Sign-In failed.')
      } else {
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-travel-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header background decoration */}
        <div className="bg-gradient-to-r from-travel-500 to-travel-600 p-8 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="mx-auto w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Compass className="animate-spin-slow text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold font-serif">Trip Buddy</h2>
          <p className="text-travel-100 text-sm mt-1">
            {isMock 
              ? 'Demo Mode: Enter any email to explore instantly!' 
              : 'Your Indian travel planner buddy'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {isMock && (
            <div className="mb-6 p-3 bg-travel-100/50 text-travel-800 text-xs rounded-xl border border-travel-200 text-center font-medium">
              ℹ️ Supabase is not configured yet. Signing in will use mock auth and save items locally.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-forest-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-travel-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. wanderer@india.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-travel-50 border border-travel-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 transition-all text-sm text-forest-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-forest-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-travel-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isMock}
                  className="w-full pl-11 pr-4 py-3 bg-travel-50 border border-travel-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 transition-all text-sm text-forest-900"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-travel-500 hover:bg-travel-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-travel-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs text-travel-400 font-medium">OR</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-travel-50 border border-travel-200 rounded-xl transition-all font-medium text-forest-700 text-sm flex items-center justify-center gap-2.5 shadow-sm hover:shadow"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-xs text-travel-500 mt-6 font-medium">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-travel-600 hover:text-travel-700 font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
