import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured, fallbackDb } from '../supabaseClient'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Star, 
  Camera, 
  Navigation, 
  Trash2,
  Compass
} from 'lucide-react'

interface FeedbackItem {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  photos?: string[];
  isGoogleReview?: boolean;
}

export const PlaceDetail: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [place, setPlace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  
  // Feedback Form State
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  
  const [tripInputs, setTripInputs] = useState<any>(null)

  // Load place details and feedback
  useEffect(() => {
    if (!placeId) return

    // Retrieve active trip inputs for directions origin geocode
    const storedInputs = localStorage.getItem('active_trip_inputs')
    if (storedInputs) {
      setTripInputs(JSON.parse(storedInputs))
    }

    const loadData = async () => {
      setLoading(true)
      try {
        // 1. Try loading fresh data from proxy details to get photos and Google reviews
        let placeData: any = null
        try {
          const res = await fetch(`/api/place-details?place_id=${placeId}`)
          placeData = await res.json()
          if (placeData && placeData.error) {
            placeData = null
          }
        } catch (e) {
          console.warn('Google Details proxy query failed, falling back to local cache.', e)
        }

        // Fallback to database cache if proxy details failed
        if (!placeData && isSupabaseConfigured() && supabase) {
          const { data } = await supabase
            .from('places')
            .select('*')
            .eq('place_id', placeId)
            .maybeSingle()
          placeData = data
        }

        // Final fallback to mock details proxy if nothing found (or if offline)
        if (!placeData) {
          const res = await fetch(`/api/place-details?place_id=${placeId}`)
          placeData = await res.json()
          if (placeData.error) throw new Error(placeData.error)
        }

        // Cache details in database
        if (placeData && isSupabaseConfigured() && supabase) {
          await supabase.from('places').upsert({
            place_id: placeId,
            name: placeData.name,
            type: placeData.type || 'place',
            lat: placeData.lat,
            lng: placeData.lng,
            address: placeData.address,
            price_level: placeData.price_level,
            google_rating: placeData.google_rating,
            user_ratings_total: placeData.user_ratings_total,
            photo_refs: placeData.photo_refs,
            contact_number: placeData.contact_number,
            opening_hours: placeData.opening_hours,
            website: placeData.website
          })
        }

        setPlace(placeData)

        // 2. Load reviews from database/fallback
        let localRevs: FeedbackItem[] = []
        if (isSupabaseConfigured() && supabase) {
          const { data: revs, error: revsErr } = await supabase
            .from('feedback')
            .select(`
              id,
              user_id,
              user_name,
              user_avatar,
              rating,
              review_text,
              created_at,
              feedback_photos(photo_url)
            `)
            .eq('place_id', placeId)
            .order('created_at', { ascending: false })

          if (revsErr) throw revsErr

          if (revs) {
            localRevs = revs.map((r: any) => ({
              id: r.id,
              user_id: r.user_id,
              user_name: r.user_name,
              user_avatar: r.user_avatar,
              rating: r.rating,
              review_text: r.review_text,
              created_at: r.created_at,
              photos: r.feedback_photos ? r.feedback_photos.map((p: any) => p.photo_url) : [],
              isGoogleReview: false
            }))
          }
        } else {
          // local storage reviews fallback
          localRevs = fallbackDb.getFeedback(placeId!).map((r: any) => ({
            ...r,
            isGoogleReview: false
          }))
        }

        // Merge local reviews with Google reviews
        let mergedReviews = [...localRevs]
        if (placeData && placeData.reviews && Array.isArray(placeData.reviews)) {
          const googleRevs = placeData.reviews.map((r: any, idx: number) => {
            const authorName = r.author_name || (r.authorAttribution && r.authorAttribution.displayName) || 'Google User';
            const authorAvatar = r.profile_photo_url || (r.authorAttribution && r.authorAttribution.photoUri) || '';
            const reviewText = r.text || (r.text && r.text.text) || (typeof r.text === 'string' ? r.text : '');
            const createdAt = r.time 
              ? new Date(r.time * 1000).toISOString() 
              : (r.publishTime ? new Date(r.publishTime).toISOString() : new Date().toISOString());
              
            return {
              id: `google-review-${idx}`,
              user_id: 'google',
              user_name: authorName,
              user_avatar: authorAvatar,
              rating: r.rating,
              review_text: reviewText,
              created_at: createdAt,
              photos: [],
              isGoogleReview: true
            };
          })
          mergedReviews = [...mergedReviews, ...googleRevs]
        }



        setFeedback(mergedReviews)
      } catch (err: any) {
        console.error(err)
        alert(`Failed to load details: ${err.message || 'Error occurred'}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [placeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-travel-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-travel-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-forest-750">Fetching place details...</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-travel-50 flex flex-col items-center justify-center gap-4">
        <Compass size={40} className="text-travel-400 animate-bounce" />
        <h2 className="text-lg font-bold text-forest-950 font-serif">Place not found</h2>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-travel-500 text-white rounded-full font-bold text-xs">
          Go Back
        </button>
      </div>
    )
  }

  const getPhotoUrl = (ref?: string, index: number = 0) => {
    if (!ref) {
      const category = place?.type || 'visit';
      const fallbacksByIndex: Record<string, string[]> = {
        stay: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80'
        ],
        eat: [
          'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80'
        ],
        visit: [
          'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=500&q=80'
        ],
        roam: [
          'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=500&q=80'
        ],
        transport: [
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80'
        ],
        bus: [
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80'
        ],
        train: [
          'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=500&q=80'
        ],
        rental: [
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80'
        ],
        agency: [
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80',
          'https://images.unsplash.com/photo-1500835595337-f7400171ab6f?auto=format&fit=crop&w=500&q=80'
        ]
      };
      const catKey = fallbacksByIndex[category] ? category : 'visit';
      return fallbacksByIndex[catKey][index % 3];
    }
    if (ref.startsWith('http://') || ref.startsWith('https://')) return ref
    const nameParam = place?.name ? `&name=${encodeURIComponent(place.name)}` : '';
    const categoryParam = place?.type ? `&category=${encodeURIComponent(place.type)}` : '';
    return `/api/place-photo?ref=${ref}${nameParam}${categoryParam}`
  }


  // Handle Photo selection and preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedPhotos(prev => [...prev, ...files])

      const previews = files.map(file => URL.createObjectURL(file))
      setPhotoPreviews(prev => [...prev, ...previews])
    }
  }

  const removePhotoSelection = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, idx) => idx !== index))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== index))
  }

  // Convert File to Base64 (for local storage storage fallback)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to submit feedback!')
      return
    }

    setUploading(true)
    try {
      const imageUrls: string[] = []

      // 1. Upload photos to Supabase Storage if configured, or convert to base64 for mock fallback
      if (isSupabaseConfigured() && supabase) {
        for (const file of selectedPhotos) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${placeId}/${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError, data } = await supabase.storage
            .from('feedback-photos')
            .upload(fileName, file, { cacheControl: '3600', upsert: true })

          if (uploadError) throw uploadError

          if (data) {
            const { data: { publicUrl } } = supabase.storage
              .from('feedback-photos')
              .getPublicUrl(fileName)
            
            imageUrls.push(publicUrl)
          }
        }

        // 2. Insert feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .insert({
            place_id: placeId,
            user_id: user.id,
            user_name: user.name,
            user_avatar: user.avatar || undefined,
            rating,
            review_text: reviewText
          })
          .select()
          .single()

        if (feedbackError) throw feedbackError

        // 3. Insert feedback photo references
        if (imageUrls.length > 0) {
          const photoInserts = imageUrls.map(url => ({
            feedback_id: feedbackData.id,
            photo_url: url
          }))
          const { error: photoErr } = await supabase
            .from('feedback_photos')
            .insert(photoInserts)

          if (photoErr) throw photoErr
        }

        // Prepend to active view state
        setFeedback(prev => [
          {
            id: feedbackData.id,
            user_id: user.id,
            user_name: user.name,
            user_avatar: user.avatar || undefined,
            rating,
            review_text: reviewText,
            created_at: feedbackData.created_at,
            photos: imageUrls
          },
          ...prev
        ])

      } else {
        // Local fallback base64 review save
        for (const file of selectedPhotos) {
          const base64 = await fileToBase64(file)
          imageUrls.push(base64)
        }

        const newMockReview = fallbackDb.saveFeedback(placeId!, {
          user_id: user.id,
          user_name: user.name,
          user_avatar: user.avatar,
          rating,
          review_text: reviewText,
          photos: imageUrls,
          place_name: place.name
        })

        setFeedback(prev => [newMockReview, ...prev])
      }

      // Reset form states
      setReviewText('')
      setRating(5)
      setSelectedPhotos([])
      setPhotoPreviews([])
      alert('Review posted successfully!')

    } catch (err: any) {
      console.error(err)
      alert(`Feedback submission failed: ${err.message || 'Error occurred'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFeedback = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return

    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('id', reviewId)
        
        if (error) throw error
      } else {
        // local storage fallback delete
        const key = `trip_buddy_mock_feedback_${placeId}`
        const revs = fallbackDb.getFeedback(placeId!)
        const filtered = revs.filter((r: any) => r.id !== reviewId)
        localStorage.setItem(key, JSON.stringify(filtered))
      }

      setFeedback(prev => prev.filter(f => f.id !== reviewId))
      alert('Review deleted.')
    } catch (err: any) {
      console.error(err)
      alert(`Deletion failed: ${err.message}`)
    }
  }

  // Calculate Average Community Rating
  const averageCommunityRating = feedback.length > 0 
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : null

  // Direction Deep-link creator
  const getDirectionsLink = () => {
    let originStr = ''
    if (tripInputs && tripInputs.lat) {
      originStr = `origin=${tripInputs.lat},${tripInputs.lng}`
    } else {
      originStr = `origin=Current+Location`
    }
    return `https://www.google.com/maps/dir/?api=1&${originStr}&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`
  }


  return (
    <div className="bg-travel-50 min-h-screen text-left py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
        
        {/* Back navigation action */}
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-travel-300 hover:bg-travel-100 rounded-full font-bold text-xs text-forest-800 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to Results</span>
          </button>
        </div>

        {/* Place Headline & Photos Grid */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-950 font-serif leading-tight">
                {place.name}
              </h1>
              <p className="text-sm text-forest-500 font-semibold flex items-center gap-1">
                <MapPin size={14} className="text-travel-500 shrink-0" />
                <span>{place.address}</span>
              </p>
            </div>

            <a
              href={getDirectionsLink()}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 bg-travel-500 hover:bg-travel-600 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer self-start md:self-auto shrink-0"
            >
              <Navigation size={14} className="fill-white" />
              <span>Get Directions</span>
            </a>
          </div>

          {/* Photo Carousel/Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[300px] sm:h-[400px]">
            {/* Main photo */}
            <div className="md:col-span-2 rounded-3xl overflow-hidden bg-travel-100 border border-travel-200 relative h-full">
              <img 
                src={getPhotoUrl(place.photo_refs && place.photo_refs[0], 0)} 
                alt={place.name} 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const category = place.type || 'visit';
                  const fallbacks: Record<string, string> = {
                    stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                    eat: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
                    visit: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80',
                    roam: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80',
                    transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                    bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
                    train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
                    rental: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
                    agency: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  };
                  e.currentTarget.src = fallbacks[category] || fallbacks['visit'];
                }}
              />
            </div>
            
            {/* Side photos */}
            <div className="hidden md:flex flex-col gap-4 h-full">
              <div className="h-[calc(50%-0.5rem)] rounded-3xl overflow-hidden bg-travel-100 border border-travel-200 relative">
                <img 
                  src={getPhotoUrl(place.photo_refs && place.photo_refs[1], 1)} 
                  alt={place.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const category = place.type || 'visit';
                    const fallbacks: Record<string, string> = {
                      stay: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80',
                      eat: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
                      visit: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=500&q=80',
                      roam: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80',
                      transport: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80',
                      bus: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=500&q=80',
                      train: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80',
                      rental: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=500&q=80',
                      agency: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80'
                    };
                    e.currentTarget.src = fallbacks[category] || fallbacks['visit'];
                  }}
                />
              </div>
              <div className="h-[calc(50%-0.5rem)] rounded-3xl overflow-hidden bg-travel-100 border border-travel-200 relative">
                <img 
                  src={getPhotoUrl(place.photo_refs && place.photo_refs[2], 2)} 
                  alt={place.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const category = place.type || 'visit';
                    const fallbacks: Record<string, string> = {
                      stay: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80',
                      eat: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80',
                      visit: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=500&q=80',
                      roam: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=500&q=80',
                      transport: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80',
                      bus: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80',
                      train: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=500&q=80',
                      rental: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=500&q=80',
                      agency: 'https://images.unsplash.com/photo-1500835595337-f7400171ab6f?auto=format&fit=crop&w=500&q=80'
                    };
                    e.currentTarget.src = fallbacks[category] || fallbacks['visit'];
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid Split: Details & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Opening Hours / Address Contact Info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-travel-200 rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* Contact info list */}
              <div className="space-y-4">
                <h3 className="font-serif font-bold text-lg text-forest-950 border-b border-travel-100 pb-2">Information</h3>
                
                {place.contact_number && (
                  <div className="flex items-start gap-3 text-xs text-forest-800 font-semibold">
                    <Phone size={16} className="text-travel-500 shrink-0 pt-0.5" />
                    <div>
                      <p className="text-[10px] text-forest-500 font-bold">Contact Number</p>
                      <a href={`tel:${place.contact_number}`} className="hover:underline">{place.contact_number}</a>
                    </div>
                  </div>
                )}

                {place.website && (
                  <div className="flex items-start gap-3 text-xs text-forest-800 font-semibold">
                    <Globe size={16} className="text-travel-500 shrink-0 pt-0.5" />
                    <div>
                      <p className="text-[10px] text-forest-500 font-bold">Website</p>
                      <a href={place.website} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px] block">{place.website.replace('https://', '').replace('http://', '')}</a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-xs text-forest-800 font-semibold">
                  <MapPin size={16} className="text-travel-500 shrink-0 pt-0.5" />
                  <div>
                    <p className="text-[10px] text-forest-500 font-bold">Address</p>
                    <p className="leading-relaxed">{place.address}</p>
                  </div>
                </div>
              </div>

              {/* Opening hours list */}
              {(place.opening_hours?.weekday_text || place.opening_hours?.weekdayDescriptions) && (
                <div className="space-y-4 border-t border-travel-100 pt-5">
                  <h3 className="font-serif font-bold text-lg text-forest-950 flex items-center gap-2">
                    <Clock size={16} className="text-travel-500" />
                    <span>Opening Hours</span>
                  </h3>
                  <div className="space-y-2 text-xs font-semibold text-forest-750">
                    {(place.opening_hours.weekday_text || place.opening_hours.weekdayDescriptions).map((dayText: string, idx: number) => (
                      <div key={idx} className="flex justify-between border-b border-travel-50/50 pb-1.5 last:border-0 last:pb-0">
                        <span>{dayText.split(': ')[0]}</span>
                        <span className="text-right text-forest-500 font-bold">{dayText.split(': ')[1] || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Embedded static Google Map iframe placeholder for aesthetic detail */}
            <div className="h-60 rounded-3xl overflow-hidden border border-travel-200 shadow-sm relative">
              <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${place.lat},${place.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>
          </div>

          {/* Right Block: Review Feed & Posting (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Rating Summaries */}
            <div className="bg-white border border-travel-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 divide-y sm:divide-y-0 sm:divide-x divide-travel-200">
              
              {/* Google ratings block */}
              <div className="flex-1 text-center py-2 sm:py-0 w-full">
                <p className="text-[10px] font-bold text-forest-500 uppercase tracking-wider mb-1">Google Places Rating</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-black font-serif text-forest-950">{place.google_rating || 'N/A'}</span>
                  <div className="text-left">
                    <div className="flex text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={14} className={idx < Math.round(place.google_rating || 0) ? 'fill-yellow-500 text-yellow-500' : 'text-travel-300'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-forest-500 font-bold">{place.user_ratings_total || 0} reviews</span>
                  </div>
                </div>
              </div>

              {/* Trip Buddy Community Rating block */}
              <div className="flex-1 text-center py-4 sm:py-0 w-full sm:pl-6">
                <p className="text-[10px] font-bold text-travel-500 uppercase tracking-wider mb-1">Trip Buddy Community</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-black font-serif text-travel-950">{averageCommunityRating || 'N/A'}</span>
                  <div className="text-left">
                    <div className="flex text-travel-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} size={14} className={idx < Math.round(Number(averageCommunityRating) || 0) ? 'fill-travel-500 text-travel-500' : 'text-travel-300'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-forest-500 font-bold">{feedback.length} local reviews</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Feedback Form */}
            {user ? (
              <form onSubmit={handleSubmitFeedback} className="bg-white border border-travel-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Add Your Review</h3>
                
                {/* Rating selection stars */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-forest-750">Your rating rating</label>
                  <div className="flex gap-2.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          size={28} 
                          className={star <= rating ? 'fill-travel-500 text-travel-500' : 'text-travel-300'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-forest-750">Review message</label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe stay quality, food taste, cleanliness, cost value, or travel tips..."
                    required
                    className="w-full p-4 bg-travel-50 border border-travel-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 text-sm font-semibold text-forest-900"
                  />
                </div>

                {/* Photo upload inputs */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 border border-travel-300 hover:bg-travel-100 rounded-xl text-xs font-bold text-forest-850 flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
                      <Camera size={14} className="text-travel-500" />
                      <span>Select Photos</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-forest-500 font-semibold">{selectedPhotos.length} photos selected</span>
                  </div>

                  {/* Thumbnail selection previews */}
                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3 p-3 bg-travel-100/30 border border-travel-200 rounded-2xl">
                      {photoPreviews.map((url, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-travel-300 group shadow-inner">
                          <img src={url} alt="selection preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhotoSelection(index)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-3 bg-travel-500 hover:bg-travel-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <LoaderComponent />
                      <span>Uploading review...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-travel-100/40 border border-travel-200 p-6 rounded-3xl text-center space-y-3 shadow-inner">
                <Compass className="w-8 h-8 text-travel-400 mx-auto animate-spin-slow" />
                <h4 className="font-bold text-sm text-forest-950 font-serif">Sign in to write reviews</h4>
                <p className="text-xs text-forest-600 max-w-sm mx-auto">
                  Only logged-in users can write reviews and upload photos. Click Profile in the navbar or Home to sign in.
                </p>
              </div>
            )}

            {/* Reviews Wall Feed */}
            <div className="space-y-4">
              <h3 className="font-serif font-black text-lg text-forest-950 border-b border-travel-100 pb-2">Traveller reviews</h3>
              
              {feedback.length === 0 ? (
                <div className="bg-white p-8 border border-travel-200 rounded-3xl text-center text-xs text-forest-500 italic">
                  No reviews submitted by Trip Buddy users yet. Be the first to share your experience!
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((review) => (
                    <div key={review.id} className="bg-white border border-travel-200 p-6 rounded-3xl shadow-sm space-y-4">
                      
                      {/* Review header: user card details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {review.user_avatar ? (
                            <img src={review.user_avatar} alt={review.user_name} className="w-9 h-9 rounded-full object-cover border border-travel-200 shadow-inner" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-travel-100 text-travel-600 flex items-center justify-center font-bold text-sm uppercase">
                              {review.user_name.charAt(0)}
                            </div>
                          )}
                          <div className="text-left space-y-0.5">
                            <h4 className="font-bold text-xs text-forest-950 flex items-center gap-1.5">
                              <span>{review.user_name}</span>
                              {review.isGoogleReview && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-extrabold rounded uppercase tracking-wider">
                                  Google
                                </span>
                              )}
                            </h4>
                            <p className="text-[9px] text-forest-500 font-semibold">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Review rating stars and delete option */}
                        <div className="flex items-center gap-4">
                          <div className="flex text-travel-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} size={11} className={idx < review.rating ? 'fill-travel-500 text-travel-500' : 'text-travel-200'} />
                            ))}
                          </div>
                          
                          {user && user.id === review.user_id && !review.isGoogleReview && (
                            <button
                              onClick={() => handleDeleteFeedback(review.id)}
                              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review text */}
                      <p className="text-xs text-forest-800 leading-relaxed font-semibold">
                        {review.review_text}
                      </p>

                      {/* Review uploaded photo gallery */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {review.photos.map((url, index) => (
                            <div key={index} className="w-20 h-20 rounded-2xl overflow-hidden border border-travel-200 shadow-sm relative group bg-travel-100">
                              <img src={url} alt="Review attachment" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

const LoaderComponent = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
)
