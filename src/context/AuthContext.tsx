import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured, getMockUser, setMockUser } from '../supabaseClient'

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isMock: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, password?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(!isSupabaseConfigured())

  // Sync auth state
  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata?.avatar_url || null,
          })
          setIsMock(false)
        } else {
          // Check if mock user is active in local storage (even with supabase initialized, for easy switching)
          const mu = getMockUser()
          if (mu) {
            setUser(mu)
            setIsMock(true)
          } else {
            setUser(null)
          }
        }
        setLoading(false)
      })

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar: session.user.user_metadata?.avatar_url || null,
          })
          setIsMock(false)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Fallback local mock user sync
      const handleMockAuthChange = () => {
        const mu = getMockUser()
        setUser(mu)
        setIsMock(true)
        setLoading(false)
      }

      handleMockAuthChange() // Initial load
      window.addEventListener('mock-auth-change', handleMockAuthChange)
      return () => {
        window.removeEventListener('mock-auth-change', handleMockAuthChange)
      }
    }
  }, [])

  const signIn = async (email: string, password?: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '123456',
      })
      if (error) return { error }
      return { error: null }
    } else {
      // Mock sign in
      const mockUser = {
        id: 'mock-user-123',
        email,
        name: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      }
      setMockUser(mockUser)
      return { error: null }
    }
  }

  const signUp = async (email: string, password?: string) => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password: password || '123456',
      })
      if (error) return { error }
      return { error: null }
    } else {
      // Mock sign up
      return signIn(email, password)
    }
  }

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })
      if (error) return { error }
      return { error: null }
    } else {
      // Mock sign in with google
      return signIn('google.traveller@gmail.com')
    }
  }

  const signOut = async () => {
    if (isSupabaseConfigured() && supabase && !isMock) {
      const { error } = await supabase.auth.signOut()
      if (error) return { error }
      return { error: null }
    } else {
      setMockUser(null)
      return { error: null }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isMock, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
