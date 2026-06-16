import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured, fallbackDb } from '../supabaseClient'
import { AuthModal } from '../components/AuthModal'
import { 
  User, 
  Mail, 
  Star, 
  Trash2, 
  Edit, 
  Check, 
  X,
  MessageSquare
} from 'lucide-react'

interface UserReview {
  id: string;
  place_id: string;
  place_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  photos?: string[];
}

export const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  
  // Editing Review States
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editReviewText, setEditReviewText] = useState('')
  const [editUploading, setEditUploading] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setIsAuthOpen(true)
      return
    }

    const loadReviews = async () => {
      setLoading(true)
      try {
        if (isSupabaseConfigured() && supabase) {
          // Fetch user's feedback joined with place names
          const { data: revsData, error: revsErr } = await supabase
            .from('feedback')
            .select(`
              id,
              place_id,
              rating,
              review_text,
              created_at,
              places(name),
              feedback_photos(photo_url)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (revsErr) throw revsErr

          if (revsData) {
            const formatted = revsData.map((r: any) => ({
              id: r.id,
              place_id: r.place_id,
              place_name: r.places ? r.places.name : 'Unknown Place',
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              photos: r.feedback_photos ? r.feedback_photos.map((p: any) => p.photo_url) : []
            }))
            setReviews(formatted)
          }

        } else {
          // Local fallback review aggregator
          const allReviews: UserReview[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('trip_buddy_mock_feedback_')) {
              const placeId = key.replace('trip_buddy_mock_feedback_', '')
              const list = JSON.parse(localStorage.getItem(key) || '[]')
              
              // Load place name from caches if possible
              const storedResults = localStorage.getItem('active_trip_results')
              let pName = 'Recommended Place'
              if (storedResults) {
                const results = JSON.parse(storedResults)
                const allPlaces = [
                  ...results.stays, 
                  ...results.eats, 
                  ...results.visits, 
                  ...results.roams,
                  ...results.transports,
                  ...results.rentals,
                  ...results.agencies
                ]
                const match = allPlaces.find((p: any) => p.place_id === placeId)
                if (match) pName = match.name
              }

              list.forEach((r: any) => {
                if (r.user_id === user.id) {
                  allReviews.push({
                    id: r.id,
                    place_id: placeId,
                    place_name: r.place_name || pName,
                    rating: r.rating,
                    review_text: r.review_text,
                    created_at: r.created_at,
                    photos: r.photos || []
                  })
                }
              })
            }
          }
          // Sort by newest
          allReviews.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setReviews(allReviews)
        }
      } catch (err: any) {
        console.error(err)
        alert(`Failed to load reviews: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [user])

  const handleDeleteReview = async (review: UserReview) => {
    if (!window.confirm(`Delete review for ${review.place_name}?`)) return

    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('id', review.id)
        
        if (error) throw error
      } else {
        // Fallback delete
        const key = `trip_buddy_mock_feedback_${review.place_id}`
        const revs = fallbackDb.getFeedback(review.place_id)
        const filtered = revs.filter((r: any) => r.id !== review.id)
        localStorage.setItem(key, JSON.stringify(filtered))
      }

      setReviews(prev => prev.filter(r => r.id !== review.id))
      alert('Review deleted.')
    } catch (err: any) {
      console.error(err)
      alert(`Deletion failed: ${err.message}`)
    }
  }

  const startEdit = (review: UserReview) => {
    setEditingId(review.id)
    setEditRating(review.rating)
    setEditReviewText(review.review_text)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleUpdateReview = async (review: UserReview) => {
    setEditUploading(true)
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('feedback')
          .update({
            rating: editRating,
            review_text: editReviewText
          })
          .eq('id', review.id)

        if (error) throw error
      } else {
        // Fallback update
        const key = `trip_buddy_mock_feedback_${review.place_id}`
        const revs = fallbackDb.getFeedback(review.place_id)
        const updated = revs.map((r: any) => {
          if (r.id === review.id) {
            return { ...r, rating: editRating, review_text: editReviewText }
          }
          return r
        })
        localStorage.setItem(key, JSON.stringify(updated))
      }

      setReviews(prev => prev.map(r => {
        if (r.id === review.id) {
          return { ...r, rating: editRating, review_text: editReviewText }
        }
        return r
      }))

      setEditingId(null)
      alert('Review updated successfully!')
    } catch (err: any) {
      console.error(err)
      alert(`Update failed: ${err.message}`)
    } finally {
      setEditUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-travel-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-travel-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-forest-750">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-travel-50 min-h-screen text-left py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Profile Card Header */}
        {!user ? (
          <div className="bg-white border border-travel-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
            <User className="w-12 h-12 text-travel-400 mx-auto animate-bounce" />
            <h3 className="font-serif font-black text-xl text-forest-950">Sign in to view your profile</h3>
            <p className="text-sm text-forest-600 max-w-sm mx-auto">
              Please log in to manage your profile details, reviews, and uploaded photos.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <>
            {/* User metadata header card */}
            <div className="bg-white border border-travel-200 rounded-[2.5rem] p-6 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="shrink-0 relative">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-travel-300 shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-travel-500 text-white flex items-center justify-center font-bold text-3xl uppercase shadow-md">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left space-y-3">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-950 font-serif leading-none">{user.name}</h1>
                  <p className="text-xs font-semibold text-forest-500 flex items-center justify-center sm:justify-start gap-1">
                    <Mail size={12} className="text-travel-400" />
                    <span>{user.email}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-forest-750 bg-travel-50 border border-travel-200 px-4 py-2.5 rounded-2xl">
                  <span className="text-travel-600 font-bold">{reviews.length} reviews posted</span>
                  <span>•</span>
                  <span>Registered Traveller</span>
                </div>
              </div>
            </div>

            {/* User Reviews lists */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-serif text-forest-950 flex items-center gap-2 border-b border-travel-100 pb-2">
                <MessageSquare size={18} className="text-travel-500" />
                <span>My Reviews history</span>
              </h2>

              {reviews.length === 0 ? (
                <div className="bg-white border border-travel-200 rounded-3xl p-10 text-center text-xs text-forest-500 italic">
                  You haven't posted any reviews yet. Share your traveller feedback on place details!
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white border border-travel-200 p-6 rounded-3xl shadow-sm space-y-4">
                      
                      {/* Place Header Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-travel-50 pb-3">
                        <div className="text-left space-y-0.5">
                          <button
                            onClick={() => navigate(`/place/${review.place_id}`)}
                            className="font-serif font-bold text-base text-forest-950 hover:text-travel-600 transition-colors text-left font-serif leading-tight"
                          >
                            {review.place_name}
                          </button>
                          <p className="text-[9px] text-forest-500 font-semibold">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Stars block */}
                        {editingId !== review.id && (
                          <div className="flex text-travel-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} size={12} className={idx < review.rating ? 'fill-travel-500 text-travel-500' : 'text-travel-200'} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Editing Block Form */}
                      {editingId === review.id ? (
                        <div className="space-y-4 bg-travel-50 p-4 border border-travel-200 rounded-2xl">
                          {/* edit rating stars */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-forest-500 uppercase tracking-wider">Edit Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className="focus:outline-none"
                                >
                                  <Star 
                                    size={20} 
                                    className={star <= editRating ? 'fill-travel-500 text-travel-500' : 'text-travel-300'} 
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* edit text */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-forest-500 uppercase tracking-wider">Edit Review Message</label>
                            <textarea
                              rows={3}
                              value={editReviewText}
                              onChange={(e) => setEditReviewText(e.target.value)}
                              className="w-full p-3 bg-white border border-travel-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-travel-500 text-xs font-semibold text-forest-900"
                            />
                          </div>

                          {/* Edit action buttons */}
                          <div className="flex justify-end gap-2 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-3.5 py-1.5 border border-travel-300 hover:bg-white rounded-lg text-forest-800 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <X size={12} />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateReview(review)}
                              disabled={editUploading}
                              className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {editUploading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Check size={12} />
                              )}
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard review message display */
                        <>
                          <p className="text-xs text-forest-800 leading-relaxed font-semibold">
                            {review.review_text}
                          </p>

                          {review.photos && review.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {review.photos.map((url, index) => (
                                <div key={index} className="w-16 h-16 rounded-xl overflow-hidden border border-travel-100 shadow-inner relative bg-travel-100 shrink-0">
                                  <img src={url} alt="Review attachment" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Review controls (edit/delete) */}
                          <div className="flex justify-end gap-3 text-[10px] font-bold pt-2 border-t border-travel-50/50">
                            <button
                              onClick={() => startEdit(review)}
                              className="px-3 py-1.5 border border-travel-300 hover:bg-travel-50 text-forest-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit size={12} className="text-travel-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review)}
                              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  )
}
