import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const POPULAR_INDIAN_DESTINATIONS = [
  'Jaipur, Rajasthan',
  'Goa',
  'Udaipur, Rajasthan',
  'Rishikesh, Uttarakhand',
  'Pondicherry',
  'Munnar, Kerala',
  'Manali, Himachal Pradesh',
  'Agra, Uttar Pradesh',
  'Leh, Ladakh',
  'Ooty, Tamil Nadu'
]

export const GooglePlacesAutocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Search destinations in India...',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep internal input in sync with value prop
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle autocomplete fetch when input changes
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      // Show default popular destinations when input is focused but short
      if (showDropdown && inputValue.trim().length === 0) {
        setSuggestions(POPULAR_INDIAN_DESTINATIONS)
      } else {
        setSuggestions([])
      }
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(inputValue)}`)
        const data = await res.json()
        if (data.predictions && data.predictions.length > 0) {
          const preds = data.predictions.map((p: any) => p.description)
          setSuggestions(preds)
        } else {
          // If no results from Google API, filter our local list
          const filtered = POPULAR_INDIAN_DESTINATIONS.filter(d => 
            d.toLowerCase().includes(inputValue.toLowerCase())
          )
          setSuggestions(filtered.length > 0 ? filtered : [inputValue])
        }
      } catch (err) {
        console.error('Autocomplete API error, using local fallback:', err)
        const filtered = POPULAR_INDIAN_DESTINATIONS.filter(d => 
          d.toLowerCase().includes(inputValue.toLowerCase())
        )
        setSuggestions(filtered.length > 0 ? filtered : [inputValue])
      } finally {
        setLoading(false)
      }
    }, 400) // Debounce delay

    return () => clearTimeout(delayDebounce)
  }, [inputValue, showDropdown])

  const handleSelect = (destination: string) => {
    setInputValue(destination)
    onChange(destination)
    setShowDropdown(false)
  }

  const handleFocus = () => {
    setShowDropdown(true)
    if (inputValue.trim().length === 0) {
      setSuggestions(POPULAR_INDIAN_DESTINATIONS)
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-travel-500" size={20} />
        <input
          type="text"
          value={inputValue}
          onFocus={handleFocus}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-10 py-3.5 bg-white border border-travel-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-travel-500/20 focus:border-travel-500 text-forest-900 transition-all font-medium text-sm shadow-sm ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-travel-400" size={18} />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-travel-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in duration-150">
          <div className="py-2 text-[11px] font-semibold uppercase tracking-wider text-travel-400 px-4 bg-travel-50/50">
            {inputValue.trim().length === 0 ? 'Popular Destinations' : 'Search Results'}
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-sm text-forest-900 hover:bg-travel-100/70 transition-colors flex items-center gap-2.5 font-medium border-b border-travel-50 last:border-b-0 cursor-pointer"
            >
              <MapPin size={15} className="text-travel-400 shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
